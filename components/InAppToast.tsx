// Toast system removed. Kept as no-op stub so existing imports stay valid.
export interface ToastData { senderName?: string; avatarUrl?: string; message?: string; chatUrl?: string; id?: string }
export function notifyUser(_data: Omit<ToastData, 'id'> & { id?: string }) { /* no-op */ }
