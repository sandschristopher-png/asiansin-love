'use client';

// Unified adapter: notifyUser now delegates to the single centered toast system.
import { emitNotificationToast } from '@/components/NotificationToast';

export interface ToastData {
  id: string;
  senderName: string;
  avatarUrl: string;
  message: string;
  chatUrl: string;
}

// Legacy component kept as no-op so existing mounts do not break.
export default function InAppToast() {
  return null;
}

export function notifyUser(data: Omit<ToastData, 'id'> & { id?: string }) {
  if (typeof window === 'undefined') return;
  emitNotificationToast({
    id: data.id || Math.random().toString(36).slice(2),
    title: data.senderName,
    description: data.message,
    linkUrl: data.chatUrl,
    avatarUrl: data.avatarUrl,
  });
}
