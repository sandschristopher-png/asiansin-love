'use client';

// Live single-face gate for /verify. Loaded only via `await import('@/lib/faceGate')` when the
// camera opens, so @mediapipe/tasks-vision never ships in any route's initial bundle.
//
// The detectors only ever read the <video> element passed in (never the page, so the pose
// reference tile can't be mistaken for a second face). Framing is measured in the part of the
// video that is actually on screen (the feed is full-screen object-cover), so a face that passes
// is always visible to the member too.
import { FilesetResolver, FaceLandmarker, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { FACE_MIN_CONFIDENCE, type FaceGateStatus } from '@/lib/faceGateMessages';

export { FACE_MIN_CONFIDENCE, type FaceGateStatus } from '@/lib/faceGateMessages';

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

// All shares below are of the visible frame (width for widths and distances, height for heights).
/** Faces narrower than this are ignored entirely (specks in the background). */
const MIN_FACE_WIDTH = 0.05;
/** A second face only counts toward "multiple faces" from this width (posters, people far behind). */
const MIN_SECOND_FACE_WIDTH = 0.14;
/** Two boxes overlapping this much are one face (glasses, headsets, shadows). */
const DEDUPE_IOU = 0.35;
/** ...as are two boxes whose centers are this close. */
const DEDUPE_CENTER = 0.12;
/** A second face only counts when its center is at least this far from the main face. */
const MULTIPLE_CENTER = 0.2;
/** Generous selfie framing: where the face center may sit, and how tall the face may be. */
const CENTER_X: [number, number] = [0.1, 0.9];
const CENTER_Y: [number, number] = [0.1, 0.88];
const FACE_HEIGHT: [number, number] = [0.12, 0.82];

export interface FaceGateResult {
  status: FaceGateStatus;
  /** Distinct faces after filtering and de-duplication. */
  faceCount: number;
  /** Main face width / visible width (0..1), when a face is present. */
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
      numFaces: 3, // room to see duplicates and a genuine second person
      minFaceDetectionConfidence: FACE_MIN_CONFIDENCE,
      minFacePresenceConfidence: FACE_MIN_CONFIDENCE,
      minTrackingConfidence: FACE_MIN_CONFIDENCE,
    });
    // Optional: without the hand model the pose step falls back to a face-only capture.
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
    initPromise = null; // allow a retry (the Restart pill)
    throw err;
  });
  return initPromise;
}

let lastTimestamp = -1;
let lastHandTimestamp = -1;

type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Face box in visible-frame units (0..1 on each axis). */
interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
  pts: NormalizedLandmark[];
}

function iou(a: Box, b: Box): number {
  const ix = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const iy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const inter = ix * iy;
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

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
    case 'open_palm':
      return f.thumb && f.index && f.middle && f.ring && f.pinky;
    case 'chin_touch': {
      const chin = face[152];
      return Boolean(chin) && [4, 8, 12].some((i) => dist(hand[i], chin) < faceWidthPx * 0.45);
    }
    default:
      return true;
  }
}

/**
 * Evaluates the current video frame. `viewW` / `viewH` are the on-screen size of the full-screen
 * <video> (object-cover); the CSS mirror doesn't matter because every bound is symmetric. Hand
 * detection only runs when a `poseId` is passed (the pose step) and the face already passes, which
 * keeps budget phones responsive.
 */
export function evaluateFaceFrame(video: HTMLVideoElement, viewW: number, viewH: number, poseId?: string): FaceGateResult {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!landmarker || !vw || !vh || video.readyState < 2 || !viewW || !viewH) {
    return { status: 'no_face', faceCount: 0, widthRatio: null, pose: 'no_hand' };
  }
  // detectForVideo needs strictly increasing timestamps.
  let ts = performance.now();
  if (ts <= lastTimestamp) ts = lastTimestamp + 1;
  lastTimestamp = ts;

  const res = landmarker.detectForVideo(video, ts);
  const raw = res.faceLandmarks || [];

  // The visible crop of the video under object-cover, in normalized video coordinates.
  const scale = Math.max(viewW / vw, viewH / vh);
  const cropW = Math.min(1, viewW / scale / vw);
  const cropH = Math.min(1, viewH / scale / vh);
  const cropX = (1 - cropW) / 2;
  const cropY = (1 - cropH) / 2;
  // Distances are compared in screen pixels, then divided by the visible width.
  const aspect = viewH / viewW;

  // 1. Boxes in visible-frame units; drop faces too small to be the member.
  const boxes: Box[] = [];
  for (const pts of raw) {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const p of pts) {
      const u = (p.x - cropX) / cropW;
      const v = (p.y - cropY) / cropH;
      if (u < x0) x0 = u;
      if (u > x1) x1 = u;
      if (v < y0) y0 = v;
      if (v > y1) y1 = v;
    }
    const w = x1 - x0;
    const h = y1 - y0;
    if (w >= MIN_FACE_WIDTH) boxes.push({ x0, y0, x1, y1, w, h, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, pts });
  }
  if (boxes.length === 0) return { status: 'no_face', faceCount: 0, widthRatio: null, pose: 'no_hand' };

  // 2. Largest first; merge overlapping or near-concentric boxes into the bigger one.
  boxes.sort((a, b) => b.w * b.h - a.w * a.h);
  const centerGap = (a: Box, b: Box) => Math.hypot(a.cx - b.cx, (a.cy - b.cy) * aspect);
  const distinct: Box[] = [];
  for (const b of boxes) {
    if (!distinct.some((d) => iou(d, b) > DEDUPE_IOU || centerGap(d, b) < DEDUPE_CENTER)) distinct.push(b);
  }

  // 3. Only a clearly separate second face counts as another person.
  const main = distinct[0];
  if (distinct.some((d) => d !== main && d.w >= MIN_SECOND_FACE_WIDTH && centerGap(main, d) > MULTIPLE_CENTER)) {
    return { status: 'multiple', faceCount: distinct.length, widthRatio: null, pose: 'no_hand' };
  }

  // 4. Arm's-length framing.
  const widthRatio = main.w;
  if (main.h < FACE_HEIGHT[0]) return { status: 'too_far', faceCount: 1, widthRatio, pose: 'no_hand' };
  if (main.h > FACE_HEIGHT[1]) return { status: 'too_close', faceCount: 1, widthRatio, pose: 'no_hand' };
  if (main.cx < CENTER_X[0] || main.cx > CENTER_X[1] || main.cy < CENTER_Y[0] || main.cy > CENTER_Y[1]) {
    return { status: 'off_center', faceCount: 1, widthRatio, pose: 'no_hand' };
  }

  return {
    status: 'ok',
    faceCount: 1,
    widthRatio,
    pose: poseId === undefined ? 'no_hand' : detectPose(video, ts, main.pts, poseId),
  };
}

/** Hand pose for an aligned face (only run then, to keep budget phones responsive). */
function detectPose(video: HTMLVideoElement, ts: number, facePts: NormalizedLandmark[], poseId: string): PoseState {
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
