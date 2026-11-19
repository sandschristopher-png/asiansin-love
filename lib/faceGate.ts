'use client';

// Live face reader for the head-turn identity check (components/verify/StepUpFlow.tsx). Loaded only via
// `await import('@/lib/faceGate')` when the camera opens, so @mediapipe/tasks-vision never ships in any
// route's initial bundle. It only ever reads the <video> element passed in.
import { FilesetResolver, FaceLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { FACE_MIN_CONFIDENCE } from '@/lib/faceGateMessages';

export { FACE_MIN_CONFIDENCE, type FaceGateStatus } from '@/lib/faceGateMessages';

// Keep the WASM runtime in lockstep with the installed @mediapipe/tasks-vision version.
const MEDIAPIPE_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm';
const FACE_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// Shares of the frame width.
/** Faces narrower than this are ignored entirely (specks in the background). */
const MIN_FACE_WIDTH = 0.05;
/** A second face only counts toward "multiple faces" from this width (posters, people far behind). */
const MIN_SECOND_FACE_WIDTH = 0.14;

let landmarker: FaceLandmarker | null = null;
let initPromise: Promise<void> | null = null;
let lastTimestamp = -1;

/** Loads the face model (once). Rejects on failure and allows a retry. */
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
  })().catch((err) => {
    initPromise = null; // allow a retry (the Restart pill)
    throw err;
  });
  return initPromise;
}

/**
 * Landmarks of the single largest face in the current frame, in RAW (un-mirrored) video coordinates, for
 * the head-turn check (lib/headPose.ts). `faces` counts every face the model sees so the caller can insist
 * on exactly one; `points` is null when there is none.
 */
export function readFaceLandmarks(video: HTMLVideoElement): { faces: number; points: NormalizedLandmark[] | null } {
  if (!landmarker || !video.videoWidth || !video.videoHeight || video.readyState < 2) return { faces: 0, points: null };
  let ts = performance.now();
  if (ts <= lastTimestamp) ts = lastTimestamp + 1;
  lastTimestamp = ts;
  const found = landmarker.detectForVideo(video, ts).faceLandmarks || [];
  if (found.length === 0) return { faces: 0, points: null };
  const width = (pts: NormalizedLandmark[]) => Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
  // Ignore specks in the background: only faces at least 5% of the frame wide count.
  const real = found.filter((pts) => width(pts) >= MIN_FACE_WIDTH);
  if (real.length === 0) return { faces: 0, points: null };
  real.sort((a, b) => width(b) - width(a));
  // Only a clearly sized second face (a real person nearby, not a poster far behind) counts as another one.
  const others = real.slice(1).filter((pts) => width(pts) >= MIN_SECOND_FACE_WIDTH).length;
  return { faces: 1 + others, points: real[0] };
}
