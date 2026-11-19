/**
 * Head direction from MediaPipe face-landmark positions, for the 4-direction liveness check.
 * Pure maths (no DOM, no model), so it is unit-tested in scripts/test-stepup.mjs.
 *
 * Landmarks come from the RAW camera frame (not the mirrored preview). Seen from the camera, the
 * member's own left side is on the right of the picture, so turning to their left moves the nose
 * toward larger x. The preview is mirrored with CSS for the member; this module never is.
 *
 * TUNING MAP (every number that decides whether a member gets stuck in the head-turn check):
 *   lib/headPose.ts (this file)        YAW_DELTA, PITCH_DELTA, CROSS_AXIS_MAX, HOLD_KEEP_SLACK, LOST_GRACE_MS,
 *                                      NEUTRAL_MAX_YAW: how far, how clean, how forgiving a turn is.
 *   components/verify/StepUpFlow.tsx   NEUTRAL_MS (steady-face time before the first pose), HOLD_TARGET_MS (time a
 *                                      pose must be held), TICK_MS (detection rate), CHECK_TIMEOUT_MS (whole check),
 *                                      FRAME_WIDTH (captured frame size), camera constraints in begin().
 *   lib/verify/stepUpRules.ts          MIN_HOLD_MS, MIN_TOTAL_MS, MAX_HOLD_MS, TOKEN_TTL_MS, MAX_ATTEMPTS_PER_HOUR
 *                                      (what the server accepts; HOLD_TARGET_MS must stay above MIN_HOLD_MS).
 *   lib/faceGate.ts + faceGateMessages MIN_FACE_WIDTH, MIN_SECOND_FACE_WIDTH, FACE_MIN_CONFIDENCE: face size and
 *                                      detector confidence for finding the face at all.
 * After a live phone test, change these and run `npm run stepup:test`.
 */
export type StepUpPose = 'turn_left' | 'turn_right' | 'look_up' | 'look_down';

export interface Pt {
  x: number;
  y: number;
}
export interface PoseRatios {
  /** Nose offset from the cheek midline, as a share of face width (+ = toward the member's left). */
  yaw: number;
  /** Nose offset from the forehead-chin midpoint, as a share of face height (+ = down). */
  pitch: number;
}

// Landmark ids in the 478-point face mesh.
const NOSE_TIP = 1;
const CHEEK_A = 234;
const CHEEK_B = 454;
const FOREHEAD = 10;
const CHIN = 152;

/** Turn needed past the member's own neutral pose (shares of face width / height). */
export const YAW_DELTA = 0.12;
export const PITCH_DELTA = 0.06;
/** The other axis may drift this much before a turn stops counting (no diagonal head waving). */
export const CROSS_AXIS_MAX = 0.1;
/**
 * Once a hold has started, the turn only has to stay past this share of the threshold. Landmark jitter around the
 * line would otherwise restart the hold again and again on a real phone.
 */
export const HOLD_KEEP_SLACK = 0.75;
/** A pose that drops out for no longer than this (a blink, one lost frame) does not restart the hold. */
export const LOST_GRACE_MS = 250;
/** The starting pose must be roughly frontal (share of face width), so the straight photo is usable. */
export const NEUTRAL_MAX_YAW = 0.15;

/** Is this face looking close enough to the camera to count as the member's neutral pose? */
export function neutralIsFrontal(r: PoseRatios): boolean {
  return Math.abs(r.yaw) <= NEUTRAL_MAX_YAW;
}

export function poseRatios(lm: ArrayLike<Pt> | null | undefined): PoseRatios | null {
  if (!lm) return null;
  const nose = lm[NOSE_TIP];
  const a = lm[CHEEK_A];
  const b = lm[CHEEK_B];
  const top = lm[FOREHEAD];
  const chin = lm[CHIN];
  if (!nose || !a || !b || !top || !chin) return null;
  const width = Math.abs(b.x - a.x);
  const height = Math.abs(chin.y - top.y);
  if (width < 1e-3 || height < 1e-3) return null;
  return {
    yaw: (nose.x - (a.x + b.x) / 2) / width,
    pitch: (nose.y - (top.y + chin.y) / 2) / height,
  };
}

/**
 * Is the head turned toward `pose` relative to the member's neutral ratios? `slack` scales the needed turn
 * (1 = the full threshold; HOLD_KEEP_SLACK is used to keep an already-started hold alive).
 */
export function poseReached(pose: StepUpPose, now: PoseRatios, neutral: PoseRatios, slack = 1): boolean {
  const dYaw = now.yaw - neutral.yaw;
  const dPitch = now.pitch - neutral.pitch;
  const yawNeed = YAW_DELTA * slack;
  const pitchNeed = PITCH_DELTA * slack;
  switch (pose) {
    case 'turn_left':
      return dYaw >= yawNeed && Math.abs(dPitch) <= CROSS_AXIS_MAX;
    case 'turn_right':
      return dYaw <= -yawNeed && Math.abs(dPitch) <= CROSS_AXIS_MAX;
    case 'look_up':
      return dPitch <= -pitchNeed && Math.abs(dYaw) <= CROSS_AXIS_MAX;
    case 'look_down':
      return dPitch >= pitchNeed && Math.abs(dYaw) <= CROSS_AXIS_MAX;
  }
}

/** How far toward the target (0..1) the head is, so the arc can react before the hold starts. */
export function poseProgress(pose: StepUpPose, now: PoseRatios, neutral: PoseRatios): number {
  const dYaw = now.yaw - neutral.yaw;
  const dPitch = now.pitch - neutral.pitch;
  const raw =
    pose === 'turn_left'
      ? dYaw / YAW_DELTA
      : pose === 'turn_right'
        ? -dYaw / YAW_DELTA
        : pose === 'look_up'
          ? -dPitch / PITCH_DELTA
          : dPitch / PITCH_DELTA;
  return Math.max(0, Math.min(1, raw));
}
