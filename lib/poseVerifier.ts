'use client';

// Loaded only via `await import('@/lib/poseVerifier')` from /verify once the camera starts, so
// @mediapipe/tasks-vision and face-api never ship in any route's initial bundle.
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import * as faceapi from '@vladmandic/face-api';
import type { PoseId } from '@/lib/verification';

// Keep the WASM runtime in lockstep with the installed @mediapipe/tasks-vision version.
const MEDIAPIPE_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm';
const FACE_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const FACE_API_MODELS = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/';

/** Head must be rotated past this many degrees for the turn poses. */
export const YAW_THRESHOLD_DEG = 15;
/** Both mouthSmile blendshapes must exceed this. */
export const SMILE_THRESHOLD = 0.5;
/** 1:1 match: face-api descriptor distance must be strictly below this. */
export const FACE_MATCH_MAX_DISTANCE = 0.5;

const BLINK_CLOSED = 0.5;
const BLINK_OPEN = 0.2;

let faceLandmarker: FaceLandmarker | null = null;
let modelsInitPromise: Promise<void> | null = null;

/** Per-pose state, reset whenever the pose changes. */
export interface BlinkTracker {
  eyesClosedSeen: boolean;
  blinkPassed: boolean;
}

export interface FrameEvaluation {
  faceDetected: boolean;
  poseMatched: boolean;
  hint: string;
  /** Estimated head yaw in degrees: negative = turned to the user's left, positive = right. */
  yaw: number | null;
}

/** Loads the face models once per session. Call only when the camera opens. */
export async function initVerifierModels(): Promise<void> {
  if (faceLandmarker) return;
  if (modelsInitPromise) return modelsInitPromise;
  modelsInitPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate: 'GPU' },
      outputFaceBlendshapes: true,
      runningMode: 'VIDEO',
      numFaces: 2, // detect a second face so we can reject it
    });
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODELS),
      faceapi.nets.faceLandmark68Net.loadFromUri(FACE_API_MODELS),
      faceapi.nets.faceRecognitionNet.loadFromUri(FACE_API_MODELS),
    ]);
  })().catch((err) => {
    modelsInitPromise = null; // allow a retry
    throw err;
  });
  return modelsInitPromise;
}

/**
 * Yaw from face-mesh landmarks (raw, un-mirrored camera image): where the nose tip sits between
 * the two cheek contour points. Frontal = 0.5. Treating the head as a cylinder,
 * offset = sin(yaw) / 2. Turning to the user's left moves the nose toward the image's right.
 */
function estimateYawDeg(lm: { x: number; y: number }[]): number | null {
  const nose = lm[1];
  const a = lm[234];
  const b = lm[454];
  if (!nose || !a || !b) return null;
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  const width = right - left;
  if (width <= 0.01) return null;
  const ratio = (nose.x - left) / width;
  const s = Math.max(-1, Math.min(1, (0.5 - ratio) * 2));
  return (Math.asin(s) * 180) / Math.PI;
}

const score = (cats: { categoryName: string; score: number }[], name: string) =>
  cats.find((c) => c.categoryName === name)?.score ?? 0;

/** Evaluates one live video frame against the current pose. */
export function evaluateLiveFrame(
  video: HTMLVideoElement,
  pose: PoseId,
  blink: BlinkTracker
): FrameEvaluation {
  if (!faceLandmarker || video.readyState < 2) {
    return { faceDetected: false, poseMatched: false, hint: 'Starting camera...', yaw: null };
  }

  const res = faceLandmarker.detectForVideo(video, performance.now());
  const faces = res.faceLandmarks?.length ?? 0;
  if (faces === 0) {
    return { faceDetected: false, poseMatched: false, hint: 'Center your face in the camera', yaw: null };
  }
  if (faces > 1) {
    return { faceDetected: false, poseMatched: false, hint: 'Only one person in the frame, please', yaw: null };
  }

  const lm = res.faceLandmarks[0];
  const cats = res.faceBlendshapes?.[0]?.categories ?? [];
  const yaw = estimateYawDeg(lm);
  const facingCamera = yaw !== null && Math.abs(yaw) < YAW_THRESHOLD_DEG / 1.5;

  switch (pose) {
    case 'blink': {
      const l = score(cats, 'eyeBlinkLeft');
      const r = score(cats, 'eyeBlinkRight');
      if (!blink.blinkPassed) {
        if (l > BLINK_CLOSED && r > BLINK_CLOSED) blink.eyesClosedSeen = true;
        else if (blink.eyesClosedSeen && l < BLINK_OPEN && r < BLINK_OPEN) blink.blinkPassed = true;
      }
      // After the blink, hold eyes open facing the camera (the frame used for the face match).
      const matched = blink.blinkPassed && facingCamera && l < BLINK_OPEN && r < BLINK_OPEN;
      return {
        faceDetected: true,
        poseMatched: matched,
        hint: !blink.blinkPassed
          ? 'Blink both eyes once'
          : matched
            ? 'Blink detected - eyes open, hold still...'
            : 'Look straight at the camera with eyes open',
        yaw,
      };
    }
    case 'turn_left': {
      const matched = yaw !== null && yaw < -YAW_THRESHOLD_DEG;
      return { faceDetected: true, poseMatched: matched, hint: matched ? 'Hold it...' : 'Turn your head to your left', yaw };
    }
    case 'turn_right': {
      const matched = yaw !== null && yaw > YAW_THRESHOLD_DEG;
      return { faceDetected: true, poseMatched: matched, hint: matched ? 'Hold it...' : 'Turn your head to your right', yaw };
    }
    case 'smile': {
      const matched =
        facingCamera &&
        score(cats, 'mouthSmileLeft') > SMILE_THRESHOLD &&
        score(cats, 'mouthSmileRight') > SMILE_THRESHOLD;
      return { faceDetected: true, poseMatched: matched, hint: matched ? 'Great smile - hold it...' : 'Smile at the camera', yaw };
    }
    default:
      return { faceDetected: true, poseMatched: false, hint: 'Unknown pose', yaw };
  }
}

/** 1:1 biometric match of a captured frontal frame against the profile avatar. */
export async function verifySelfieAgainstAvatar(
  selfieCanvas: HTMLCanvasElement,
  avatarUrl: string
): Promise<{ matched: boolean; distance: number; error?: string }> {
  const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
  const selfieDet = await faceapi.detectSingleFace(selfieCanvas, opts).withFaceLandmarks().withFaceDescriptor();
  if (!selfieDet) {
    return { matched: false, distance: 1, error: 'Your face was not clear enough in the capture.' };
  }

  let avatarImg: HTMLImageElement;
  try {
    avatarImg = await faceapi.fetchImage(avatarUrl);
  } catch {
    return { matched: false, distance: 1, error: 'Could not load your profile photo for the face match.' };
  }
  const avatarDet = await faceapi.detectSingleFace(avatarImg, opts).withFaceLandmarks().withFaceDescriptor();
  if (!avatarDet) {
    return { matched: false, distance: 1, error: 'We could not find a clear face in your main profile photo. Update it and try again.' };
  }

  const distance = faceapi.euclideanDistance(selfieDet.descriptor, avatarDet.descriptor);
  const matched = distance < FACE_MATCH_MAX_DISTANCE;
  return {
    matched,
    distance: Number(distance.toFixed(3)),
    error: matched ? undefined : 'This capture does not match your main profile photo.',
  };
}
