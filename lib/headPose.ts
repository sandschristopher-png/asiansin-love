/**
 * Head direction from MediaPipe face-landmark positions, for the 4-direction liveness check.
 * Pure maths (no DOM, no model), so it is unit-tested in scripts/test-stepup.mjs.
 *
 * Landmarks come from the RAW camera frame (not the mirrored preview). Seen from the camera, the
 * member's own left side is on the right of the picture, so turning to their left moves the nose
 * toward larger x. The preview is mirrored with CSS for the member; this module never is.
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

/** Is the head turned toward `pose` relative to the member's neutral ratios? */
export function poseReached(pose: StepUpPose, now: PoseRatios, neutral: PoseRatios): boolean {
  const dYaw = now.yaw - neutral.yaw;
  const dPitch = now.pitch - neutral.pitch;
  switch (pose) {
    case 'turn_left':
      return dYaw >= YAW_DELTA && Math.abs(dPitch) <= CROSS_AXIS_MAX;
    case 'turn_right':
      return dYaw <= -YAW_DELTA && Math.abs(dPitch) <= CROSS_AXIS_MAX;
    case 'look_up':
      return dPitch <= -PITCH_DELTA && Math.abs(dYaw) <= CROSS_AXIS_MAX;
    case 'look_down':
      return dPitch >= PITCH_DELTA && Math.abs(dYaw) <= CROSS_AXIS_MAX;
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
