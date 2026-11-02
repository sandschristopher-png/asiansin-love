// Canonical subscribe endpoint used by lib/push.ts. Same handler as /api/push/subscribe,
// which stays for any client still running an older bundle.
export { POST } from '@/app/api/push/subscribe/route';
