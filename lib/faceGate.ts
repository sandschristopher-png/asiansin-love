'use client';

// Live single-face gate for /verify. Loaded only via `await import('@/lib/faceGate')` when the
// camera opens, so @mediapipe/tasks-vision never ships in any route's initial bundle.
import { FilesetResolver, FaceLandmarker, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { FACE_MIN_CONFIDENCE, type FaceGateStatus } from '@/lib/faceGateMessages';

export { FACE_MIN_CONFIDENCE, FACE_GATE_MESSAGES, type FaceGateStatus } from '@/lib/faceGateMessages';

// Keep the WASM runtime in lockstep with the installed @mediapipe/tasks-vision version.
const MEDIAPIPE_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm';
const FACE_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const HAND_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

/**
 * Hand pose in the current frame, for auto-capture:
 *   match       the requested pose is being made
 *   hand        a hand is visible but not (yet) in the pose
 *   no_hand     no hand in view (or the face isn't aligned yet)
 *   unavailable the hand model could not load on this device; face-only capture is used
 */
export type PoseState = 'match' | 'hand' | 'no_hand' | 'unavailable';

/** Face width as a share of the visible camera width (rejects hands up close / far silhouettes). */
export const FACE_WIDTH_MIN = 0.3;
export const FACE_WIDTH_MAX = 0.75;
/** Nose tip, left eye outer, right eye outer, chin: all must sit inside the guide oval. */
const ANCHORS = [1, 33, 263, 152] as const;

export interface FaceGateResult {
  status: FaceGateStatus;
  faceCount: number;
  /** Face width / visible width (0..1), when exactly one face is present. */
  widthRatio: number | null;
  pose: PoseState;
}

let landmarker: FaceLandmarker | null = null;
let hands: HandLandmarker | null = null;
let initPromise: Promise<void> | null = null;

export async function initFaceGate(): Promise<void> {
  if (landmarker) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
    landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces: 2, // see a second face so it can be rejected
      minFaceDetectionConfidence: FACE_MIN_CONFIDENCE,
      minFacePresenceConfidence: FACE_MIN_CONFIDENCE,
      minTrackingConfidence: FACE_MIN_CONFIDENCE,
    });
    // Optional: without the hand model the page falls back to a timed face-only capture.
    try {
      hands = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: HAND_LANDMARKER_MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
    } catch (err) {
      console.warn('[faceGate] hand model unavailable, using face-only capture:', err);
      hands = null;
    }
  })().catch((err) => {
    initPromise = null; // allow a retry
    throw err;
  });
  return initPromise;
}

/**
 * The guide oval as drawn in app/verify/page.tsx: centered, width min(68% of view, 300px),
 * aspect 3:4. Kept here so the check and the drawing can't drift apart.
 */
export function guideOval(viewW: number, viewH: number) {
  const w = Math.min(viewW * 0.68, 300);
  return { cx: viewW / 2, cy: viewH / 2, rx: w / 2, ry: (w * 4) / 3 / 2 };
}

let lastTimestamp = -1;
let lastHandTimestamp = -1;

type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Finger states from the 21 hand landmarks (in pixels). A finger counts as extended when its tip
 * is clearly farther from the wrist than its middle joint; the thumb when its tip is clearly
 * farther from the middle-finger knuckle than its own middle joint.
 */
function fingerStates(h: Pt[]) {
  const wrist = h[0];
  const ext = (tip: number, pip: number) => dist(h[tip], wrist) > dist(h[pip], wrist) * 1.1;
  return {
    thumb: dist(h[4], h[9]) > dist(h[3], h[9]) * 1.15 && dist(h[4], h[5]) > dist(h[2], h[5]),
    index: ext(8, 6),
    middle: ext(12, 10),
    ring: ext(16, 14),
    pinky: ext(20, 18),
  };
}

/** Does this hand make the requested pose (ids from lib/poses.ts)? Unknown ids accept any hand. */
function matchesPose(poseId: string | undefined, hand: Pt[], face: Pt[], faceWidthPx: number): boolean {
  const f = fingerStates(hand);
  switch (poseId) {
    case 'peace':
      return f.index && f.middle && !f.ring && !f.pinky;
    case 'thumbs_up':
      // Image y grows downward: the thumb tip sits above its base.
      return f.thumb && !f.index && !f.middle && !f.ring && !f.pinky && hand[4].y < hand[2].y;
    case 'three_fingers':
      return [f.thumb, f.index, f.middle, f.ring, f.pinky].filter(Boolean).length === 3;
    case 'chin_touch': {
      const chin = face[152];
      return Boolean(chin) && [4, 8, 12].some((i) => dist(hand[i], chin) < faceWidthPx * 0.45);
    }
    default:
      return true;
  }
}

/**
 * Evaluates the current video frame against the gate. `viewW` / `viewH` are the on-screen size
 * of the <video> (object-cover). The CSS mirror doesn't matter: the oval is horizontally centered.
 */
export function evaluateFaceFrame(video: HTMLVideoElement, viewW: number, viewH: number, poseId?: string): FaceGateResult {
  if (!landmarker || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
    return { status: 'no_face', faceCount: 0, widthRatio: null, pose: 'no_hand' };
  }
  // detectForVideo needs strictly increasing timestamps.
  let ts = performance.now();
  if (ts <= lastTimestamp) ts = lastTimestamp + 1;
  lastTimestamp = ts;

  const res = landmarker.detectForVideo(video, ts);
  const faces = res.faceLandmarks || [];
  if (faces.length === 0) return { status: 'no_face', faceCount: 0, widthRatio: null, pose: 'no_hand' };
  if (faces.length > 1) return { status: 'multiple', faceCount: faces.length, widthRatio: null, pose: 'no_hand' };

  // Map normalized video coordinates to the object-cover rendering on screen.
  const scale = Math.max(viewW / video.videoWidth, viewH / video.videoHeight);
  const drawnW = video.videoWidth * scale;
  const drawnH = video.videoHeight * scale;
  const offX = (viewW - drawnW) / 2;
  const offY = (viewH - drawnH) / 2;
  const toScreen = (p: { x: number; y: number }) => ({ x: p.x * drawnW + offX, y: p.y * drawnH + offY });

  const pts = faces[0];
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of pts) {
    const sx = toScreen(p).x;
    if (sx < minX) minX = sx;
    if (sx > maxX) maxX = sx;
  }
  const widthRatio = (maxX - minX) / viewW;
  if (widthRatio < FACE_WIDTH_MIN) return { status: 'too_far', faceCount: 1, widthRatio, pose: 'no_hand' };
  if (widthRatio > FACE_WIDTH_MAX) return { status: 'too_close', faceCount: 1, widthRatio, pose: 'no_hand' };

  const oval = guideOval(viewW, viewH);
  const inside = ANCHORS.every((i) => {
    const p = pts[i];
    if (!p) return false;
    const s = toScreen(p);
    return ((s.x - oval.cx) / oval.rx) ** 2 + ((s.y - oval.cy) / oval.ry) ** 2 <= 1;
  });
  if (!inside) return { status: 'off_center', faceCount: 1, widthRatio, pose: 'no_hand' };

  return { status: 'ok', faceCount: 1, widthRatio, pose: detectPose(video, ts, pts, poseId) };
}

/** Hand pose for an aligned face (only run then, to keep budget phones responsive). */
function detectPose(video: HTMLVideoElement, ts: number, facePts: NormalizedLandmark[], poseId?: string): PoseState {
  if (!hands) return 'unavailable';
  let hts = ts;
  if (hts <= lastHandTimestamp) hts = lastHandTimestamp + 1;
  lastHandTimestamp = hts;
  let found: NormalizedLandmark[][];
  try {
    found = hands.detectForVideo(video, hts).landmarks || [];
  } catch {
    return 'unavailable';
  }
  if (found.length === 0) return 'no_hand';
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const px = (p: NormalizedLandmark): Pt => ({ x: p.x * vw, y: p.y * vh });
  const face = facePts.map(px);
  const faceXs = face.map((p) => p.x);
  const faceWidthPx = Math.max(...faceXs) - Math.min(...faceXs);
  return found.some((hand) => matchesPose(poseId, hand.map(px), face, faceWidthPx)) ? 'match' : 'hand';
}
