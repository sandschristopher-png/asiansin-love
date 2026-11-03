// Alias of /api/verify/submit, which stores the selfie and runs the Gemini pre-screen
// (lib/aiVision.ts reviewVerificationSelfie). The result only informs the admin queue: an admin
// grants the verified badge.
export const runtime = 'nodejs';
export const maxDuration = 30;
export { POST } from '@/app/api/verify/submit/route';
