// Shared, dependency-free parts of the /verify face gate (safe to import statically, including on
// the server; the MediaPipe detector itself lives in lib/faceGate.ts and is loaded on demand).

/**
 * Detector confidence floor; reported to the server, which rejects anything lower. Kept low on
 * purpose: warm or colored indoor light and front-camera noise drop a clearly visible face into
 * the 0.58-0.74 range. Gemini and an admin still review every selfie.
 */
export const FACE_MIN_CONFIDENCE = 0.55;

export type FaceGateStatus = 'ok' | 'no_face' | 'multiple' | 'off_center' | 'too_far' | 'too_close';
