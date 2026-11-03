'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { applyContactRevealMask } from '@/lib/safety';
import { NotificationToast, type MessageToastData } from '@/components/NotificationToast';

/**
 * App-wide listener for incoming messages (mounted once in LayoutShell, so it runs on every route).
 * Shows a NotificationToast unless the member already has that conversation open. The BottomNav
 * badge has its own unread counter on the same table.
 */
export function MessageNotifier() {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const [toast, setToast] = useState<MessageToastData | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const subscribe = (uid: string) => {
      if (channel) supabase.removeChannel(channel);
      channel = supabase
        .channel(`message-notifier-${uid}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${uid}` },
          async (payload) => {
            const row = payload.new as {
              id: string;
              sender_id: string;
              content?: string | null;
              is_quarantined?: boolean | null;
              audio_path?: string | null;
            };
            if (cancelled || !row?.sender_id || row.is_quarantined) return;

            const { data: sender } = await supabase
              .from('profiles')
              .select('username, display_name, full_name, avatar_url')
              .eq('id', row.sender_id)
              .maybeSingle();

            // Already looking at this conversation (/chat/{id} or /chat/{username}): no toast.
            const openChat = (pathRef.current || '').match(/^\/chat\/([^/?#]+)/)?.[1];
            const openKey = openChat ? decodeURIComponent(openChat).replace(/^@+/, '').toLowerCase() : null;
            if (openKey && (openKey === row.sender_id.toLowerCase() || openKey === String(sender?.username || '').toLowerCase())) {
              return;
            }

            const name =
              (sender?.username && !String(sender.username).startsWith('user_') ? String(sender.username).replace(/^@/, '') : '') ||
              sender?.display_name ||
              sender?.full_name ||
              'New message';
            // Contact details stay hidden in previews, as in a locked chat.
            const preview = row.audio_path
              ? '🎤 Voice note'
              : applyContactRevealMask(String(row.content || ''), 0).text || 'Sent you a message';

            setToast({
              key: row.id,
              senderId: row.sender_id,
              name,
              avatarUrl: sender?.avatar_url ?? null,
              preview,
            });
          }
        )
        .subscribe();
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user) subscribe(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) subscribe(session.user.id);
      else if (channel) {
        supabase.removeChannel(channel);
        channel = null;
        setToast(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <NotificationToast
      toast={toast}
      onClose={closeToast}
      onOpen={(t) => {
        setToast(null);
        router.push(`/chat/${t.senderId}`);
      }}
    />
  );
}

export default MessageNotifier;
