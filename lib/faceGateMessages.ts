// Shared, dependency-free parts of the /verify face gate (safe to import statically, including on
// the server; the MediaPipe detector itself lives in lib/faceGate.ts and is loaded on demand).

/** Detector confidence floor; reported to the server, which rejects anything lower. */
export const FACE_MIN_CONFIDENCE = 0.78;

export type FaceGateStatus = 'ok' | 'no_face' | 'multiple' | 'off_center' | 'too_far' | 'too_close';
