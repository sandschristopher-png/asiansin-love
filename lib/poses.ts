/**
 * Mascot hand poses for selfie verification. Ids must match POSE_POOL in lib/verify/token.ts.
 * The server issues one random pose per attempt; the member copies it in a single selfie, and
 * Gemini pre-screens the shot before an admin approves it.
 */
export type PoseId = 'peace' | 'thumbs_up' | 'chin_touch' | 'three_fingers';

export interface VerificationPose {
  id: PoseId;
  label: string;
  /** Mascot reference image in public/images/verification/. */
  image: string;
  /** Plain-language description sent to the vision model alongside the selfie. */
  aiDescription: string;
}

export const VERIFICATION_POSES: VerificationPose[] = [
  {
    id: 'peace',
    label: 'Peace sign by your cheek',
    image: '/images/verification/pose-peace.png',
    aiDescription: 'a peace / V sign (index and middle finger raised) held next to the cheek',
  },
  {
    id: 'thumbs_up',
    label: 'Thumbs up next to your face',
    image: '/images/verification/pose-thumbs.png',
    aiDescription: 'a thumbs-up gesture held next to the face',
  },
  {
    id: 'chin_touch',
    label: 'Hand touching your chin',
    image: '/images/verification/pose-chin.png',
    aiDescription: 'one hand touching the chin',
  },
  {
    id: 'three_fingers',
    label: 'Three fingers held up',
    image: '/images/verification/pose-three.png',
    aiDescription: 'one hand holding up exactly three fingers',
  },
];

export function getPoseById(id: string | null | undefined): VerificationPose | null {
  return VERIFICATION_POSES.find((p) => p.id === id) ?? null;
}
