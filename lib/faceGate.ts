'use client';

// Live single-face gate for /verify. Loaded only via `await import('@/lib/faceGate')` when the
// camera opens, so @mediapipe/tasks-vision never ships in any route's initial bundle.
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { FACE_MIN_CONFIDENCE, type FaceGateStatus } from '@/lib/faceGateMessages';

export { FACE_MIN_CONFIDENCE, FACE_GATE_MESSAGES, type FaceGateStatus } from '@/lib/faceGateMessages';

// Keep the WASM runtime in lockstep with the installed @mediapipe/tasks-vision version.
const MEDIAPIPE_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm';
const FACE_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

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
}

let landmarker: FaceLandmarker | null = null;
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

/**
 * Evaluates the current video frame against the gate. `viewW` / `viewH` are the on-screen size
 * of the <video> (object-cover). The CSS mirror doesn't matter: the oval is horizontally centered.
 */
export function evaluateFaceFrame(video: HTMLVideoElement, viewW: number, viewH: number): FaceGateResult {
  if (!landmarker || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
    return { status: 'no_face', faceCount: 0, widthRatio: null };
  }
  // detectForVideo needs strictly increasing timestamps.
  let ts = performance.now();
  if (ts <= lastTimestamp) ts = lastTimestamp + 1;
  lastTimestamp = ts;

  const res = landmarker.detectForVideo(video, ts);
  const faces = res.faceLandmarks || [];
  if (faces.length === 0) return { status: 'no_face', faceCount: 0, widthRatio: null };
  if (faces.length > 1) return { status: 'multiple', faceCount: faces.length, widthRatio: null };

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
  if (widthRatio < FACE_WIDTH_MIN) return { status: 'too_far', faceCount: 1, widthRatio };
  if (widthRatio > FACE_WIDTH_MAX) return { status: 'too_close', faceCount: 1, widthRatio };

  const oval = guideOval(viewW, viewH);
  const inside = ANCHORS.every((i) => {
    const p = pts[i];
    if (!p) return false;
    const s = toScreen(p);
    return ((s.x - oval.cx) / oval.rx) ** 2 + ((s.y - oval.cy) / oval.ry) ** 2 <= 1;
  });
  if (!inside) return { status: 'off_center', faceCount: 1, widthRatio };

  return { status: 'ok', faceCount: 1, widthRatio };
}
