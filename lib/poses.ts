/**
 * Hand poses for selfie verification. Ids must match POSE_POOL in lib/verify/token.ts.
 * The server issues one random pose per attempt (app/api/verify/start); the member copies it in a
 * single selfie, and Gemini pre-screens the shot before an admin approves it.
 */
export type PoseId = 'thumbs_up' | 'peace' | 'three_fingers' | 'chin_touch' | 'open_palm';

export interface VerificationPose {
  id: PoseId;
  /** English label for admin tools; members see the translated verify.poseLabel.* text. */
  label: string;
  /** Reference photo (the landing-page model making the pose) in public/. */
  image: string;
  /** Plain-language description sent to the vision model alongside the selfie. */
  aiDescription: string;
}

export const VERIFICATION_POSES: VerificationPose[] = [
  {
    id: 'thumbs_up',
    label: 'Thumbs up next to your face',
    image: '/pose-1.png',
    aiDescription: 'a thumbs-up gesture held next to the face',
  },
  {
    id: 'peace',
    label: 'Peace sign by your cheek',
    image: '/pose-2.png',
    aiDescription: 'a peace / V sign (index and middle finger raised) held next to the cheek',
  },
  {
    id: 'three_fingers',
    label: 'Three fingers held up',
    image: '/pose-3.png',
    aiDescription: 'one hand holding up exactly three fingers',
  },
  {
    id: 'chin_touch',
    label: 'Hand touching your chin',
    image: '/pose-4.png',
    aiDescription: 'one hand touching the chin',
  },
  {
    id: 'open_palm',
    label: 'Open palm wave',
    image: '/pose-5.png',
    aiDescription: 'an open palm raised next to the face with all five fingers spread, as in a wave',
  },
];

export function getPoseById(id: string | null | undefined): VerificationPose | null {
  return VERIFICATION_POSES.find((p) => p.id === id) ?? null;
}
