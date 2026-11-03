// Shared, dependency-free parts of the /verify face gate (safe to import statically; the
// MediaPipe detector itself lives in lib/faceGate.ts and is loaded on demand).

/** Detector confidence floor; reported to the server, which rejects anything lower. */
export const FACE_MIN_CONFIDENCE = 0.8;

export type FaceGateStatus = 'ok' | 'no_face' | 'multiple' | 'off_center' | 'too_far' | 'too_close';

export const FACE_GATE_MESSAGES: Record<FaceGateStatus, string> = {
  ok: 'Face aligned. Hold steady...',
  no_face: 'No face detected. Keep face in view.',
  multiple: 'Multiple faces detected. Only one person allowed.',
  off_center: 'Center face in the oval.',
  too_far: 'Move a little closer.',
  too_close: 'Move a little further away.',
};
