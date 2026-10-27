'use client';

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NotificationToast, emitNotificationToast } from '@/components/NotificationToast';

const ICON_BY_TYPE: Record<string, string> = {
  message: '💬',
  match: '💖',
  visit: '👀',
  spark: '✨',
  favorite: '❤️',
  verification: '🛡️',
  system: '🔔',
};

export function GlobalNotificationListener() {
  useEffect(() => {
    let channel: any = null;
    let isMounted = true;

    async function setupRealtimeSubscription(uid: string) {
      if (channel) {
        await supabase.removeChannel(channel);
      }

      const channelName = 'global-toast-notifications-' + uid;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: 'user_id=eq.' + uid,
          },
          async (payload: any) => {
            if (!isMounted || !payload.new) return;
            const row = payload.new;
            let avatarUrl: string | undefined = undefined;

            if (row.actor_id) {
              const { data: actor } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('id', row.actor_id)
                .maybeSingle();
              if (actor?.avatar_url) {
                avatarUrl = actor.avatar_url;
              }
            }

            emitNotificationToast({
              title: row.title || 'New Notification',
              description: row.description || 'You have a new update on asians in love.',
              linkUrl: row.link_url || '/favorites',
              avatarUrl,
            });
          }
        )
        .subscribe();
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && isMounted) {
        setupRealtimeSubscription(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && isMounted) {
        setupRealtimeSubscription(session.user.id);
      } else if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return <NotificationToast />;
}

export default GlobalNotificationListener;
