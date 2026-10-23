'use client';

import {
  FilesetResolver,
  FaceLandmarker,
  GestureRecognizer,
} from '@mediapipe/tasks-vision';
import * as faceapi from '@vladmandic/face-api';

let faceLandmarker: FaceLandmarker | null = null;
let gestureRecognizer: GestureRecognizer | null = null;
let modelsInitPromise: Promise<void> | null = null;

export interface BlinkTracker {
  eyesClosedSeen: boolean;
  blinkPassed: boolean;
}

export interface FrameEvaluation {
  faceDetected: boolean;
  blinkPassed: boolean;
  poseMatched: boolean;
  hint: string;
}

/** Loads WASM models from free CDNs once per session. Lazy: call only when camera opens. */
export async function initVerifierModels(): Promise<void> {
  if (faceLandmarker && gestureRecognizer) return;
  if (modelsInitPromise) return modelsInitPromise;
  modelsInitPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    const [faceModel, gestureModel] = await Promise.all([
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      }),
      GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      }),
    ]);

    faceLandmarker = faceModel;
    gestureRecognizer = gestureModel;

    const FACE_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL),
    ]);
  })();
  return modelsInitPromise;
}

/**
 * Matches our 4-pose pool using MediaPipe gesture categories plus
 * 21-keypoint finger geometry. Chin-rest uses hand-near-face proximity.
 */
function matchHandPose(poseTitle: string, gestureResult: unknown, noseY: number | null): boolean {
  const result = gestureResult as {
    gestures?: { categoryName: string }[][];
    landmarks?: { x: number; y: number }[][];
  };
  const label = poseTitle.toLowerCase();
  const topGesture = result.gestures?.[0]?.[0];
  const lm = result.landmarks?.[0];

  if (!lm || lm.length < 21) return false;

  const indexUp = lm[8].y < lm[6].y;
  const middleUp = lm[12].y < lm[10].y;
  const ringUp = lm[16].y < lm[14].y;
  const pinkyUp = lm[20].y < lm[18].y;
  const thumbUp = lm[4].y < lm[3].y && lm[4].y < lm[5].y;

  // Peace sign
  if (label.includes('peace') || label.includes('victory') || label.includes('v sign')) {
    return (
      topGesture?.categoryName === 'Victory' ||
      (indexUp && middleUp && !ringUp && !pinkyUp)
    );
  }

  // Three fingers
  if (label.includes('three') || label.includes('3')) {
    return (
      (indexUp && middleUp && ringUp && !pinkyUp) ||
      (middleUp && ringUp && pinkyUp && !indexUp) ||
      topGesture?.categoryName === 'ILoveYou'
    );
  }

  // Open palm
  if (label.includes('palm') || label.includes('wave') || label.includes('open') || label.includes('hand') || label.includes('five')) {
    return (
      topGesture?.categoryName === 'Open_Palm' ||
      (indexUp && middleUp && ringUp && pinkyUp)
    );
  }

  // Chin rest: any visible hand held near chin height (below nose)
  if (label.includes('chin')) {
    if (noseY === null) return false;
    const wristY = lm[0].y;
    const handCenterX = (lm[0].x + lm[9].x) / 2;
    return wristY > noseY - 0.05 && wristY < noseY + 0.25 && handCenterX > 0.15 && handCenterX < 0.85;
  }

  // Thumbs up
  if (label.includes('thumb')) {
    return (
      topGesture?.categoryName === 'Thumb_Up' ||
      (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp)
    );
  }

  // Fallback for unmapped custom poses: require a visible hand
  return true;
}

/**
 * Evaluates one live video frame: face presence, blink liveness, pose match.
 */
export function evaluateLiveFrame(
  video: HTMLVideoElement,
  poseTitle: string,
  blinkTracker: BlinkTracker
): FrameEvaluation {
  if (!faceLandmarker || !gestureRecognizer || video.readyState < 2) {
    return { faceDetected: false, blinkPassed: false, poseMatched: false, hint: 'Starting camera...' };
  }

  const now = performance.now();
  const faceRes = faceLandmarker.detectForVideo(video, now);
  const landmarks = faceRes.faceLandmarks?.[0];
  const hasFace = (faceRes.faceLandmarks?.length || 0) === 1;

  if (!hasFace || !landmarks) {
    return { faceDetected: false, blinkPassed: blinkTracker.blinkPassed, poseMatched: false, hint: 'Center your face in the camera' };
  }

  // Gate 1: blink liveness (once per session)
  if (!blinkTracker.blinkPassed) {
    const shapes = faceRes.faceBlendshapes?.[0]?.categories || [];
    const lBlink = shapes.find((c) => c.categoryName === 'eyeBlinkLeft')?.score || 0;
    const rBlink = shapes.find((c) => c.categoryName === 'eyeBlinkRight')?.score || 0;

    if (lBlink > 0.42 && rBlink > 0.42) {
      blinkTracker.eyesClosedSeen = true;
    } else if (blinkTracker.eyesClosedSeen && lBlink < 0.2 && rBlink < 0.2) {
      blinkTracker.blinkPassed = true;
    }

    if (!blinkTracker.blinkPassed) {
      return { faceDetected: true, blinkPassed: false, poseMatched: false, hint: 'Blink both eyes once to confirm you are live' };
    }
  }

  // Gate 2: hand pose while face present
  const gestureRes = gestureRecognizer.recognizeForVideo(video, now);
  const noseY = landmarks[1]?.y ?? null;
  const poseMatched = matchHandPose(poseTitle, gestureRes, noseY);

  return {
    faceDetected: true,
    blinkPassed: true,
    poseMatched,
    hint: poseMatched ? 'Pose matched - hold steady...' : 'Now match the pose: ' + poseTitle,
  };
}

/**
 * Gate 3: 1:1 biometric match of the captured frame against the profile avatar.
 */
export async function verifySelfieAgainstAvatar(
  selfieCanvas: HTMLCanvasElement,
  avatarUrl: string
): Promise<{ matched: boolean; distance: number; error?: string }> {
  const selfieDet = await faceapi
    .detectSingleFace(selfieCanvas, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!selfieDet) {
    return { matched: false, distance: 1, error: 'Face was not clear enough in the capture.' };
  }

  const avatarImg = await faceapi.fetchImage(avatarUrl);
  const avatarDet = await faceapi
    .detectSingleFace(avatarImg, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!avatarDet) {
    return { matched: false, distance: 1, error: 'Could not detect a face in your profile photo.' };
  }

  const distance = faceapi.euclideanDistance(selfieDet.descriptor, avatarDet.descriptor);
  return {
    matched: distance <= 0.55,
    distance: Number(distance.toFixed(3)),
    error: distance > 0.55 ? 'Capture does not match your profile photo.' : undefined,
  };
}