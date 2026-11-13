'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { applyContactRevealMask } from '@/lib/safety';
import { alertPrefs, getNotificationCounts, setNotificationCounts, NOTIFICATIONS_CHANGED_EVENT } from '@/lib/notificationStore';
import { NotificationToast, type NotificationKind, type NotificationToastData } from '@/components/NotificationToast';
import { publicName } from '@/lib/publicName';

const SPARKS_SEEN_KEY = 'ail_sparks_seen_at';

type Actor = { username?: string | null; display_name?: string | null; full_name?: string | null; avatar_url?: string | null };

function actorName(a: Actor | null, fallback: string): string {
  if (!a) return fallback;
  return publicName(a, fallback);
}

function sparksSeenAt(): string {
  try {
    const v = localStorage.getItem(SPARKS_SEEN_KEY);
    if (v) return v;
    // First run on this device: start the badge at zero instead of counting every past Spark.
    const now = new Date().toISOString();
    localStorage.setItem(SPARKS_SEEN_KEY, now);
    return now;
  } catch {
    return new Date().toISOString();
  }
}

/**
 * App-wide notification engine, mounted once in LayoutShell. One realtime channel per member
 * (`realtime-user-notifications-{id}`) covers:
 *   A. new messages to me        -> toast (unless that chat is open) + Messages badge
 *   B. new Sparks to me          -> toast + Sparks badge
 *   C. a Spark that makes it mutual -> celebration toast, tap opens the chat
 *   D. profile visits            -> toast for members with Visitor History (Plus, or women)
 * Silent by design: each event shows the toast and gives a short haptic pulse (no sounds). While
 * the tab is hidden and web push isn't already covering this device, it raises a browser alert.
 */
export function RealtimeNotifier() {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const [toast, setToast] = useState<NotificationToastData | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    pathRef.current = pathname;
    // Opening Sparks marks every Spark as seen.
    if (pathname?.startsWith('/favorites')) {
      try {
        localStorage.setItem(SPARKS_SEEN_KEY, new Date().toISOString());
      } catch {}
      setNotificationCounts({ unseenSparks: 0 });
    }
  }, [pathname]);

  // "(3) Meet in Asia" while anything is unread; re-applied after every route change.
  useEffect(() => {
    const apply = () => {
      const { unreadMessages, unseenSparks } = getNotificationCounts();
      const total = unreadMessages + unseenSparks;
      const base = document.title.replace(/^\(\d+\)\s*/, '');
      document.title = total > 0 ? `(${total}) ${base || 'Meet in Asia'}` : base;
    };
    apply();
    const t = window.setTimeout(apply, 300); // after Next applies the new page's metadata title
    return () => window.clearTimeout(t);
  }, [pathname, toast]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    let visitorAccess = false;
    let subscribedUid: string | null = null;
    /** Members blocked in either direction: no toasts, and their rows never count toward badges. */
    let blockedIds = new Set<string>();

    const loadBlocks = async (uid: string) => {
      const { data } = await supabase
        .from('user_blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`);
      blockedIds = new Set(
        ((data || []) as { blocker_id: string; blocked_id: string }[]).map((b) => (b.blocker_id === uid ? b.blocked_id : b.blocker_id))
      );
    };
    // PostgREST "not in" list for badge counts (no-op when nobody is blocked).
    const notInBlocked = () => (blockedIds.size ? `(${Array.from(blockedIds).join(',')})` : null);

    const refreshUnreadMessages = async (uid: string) => {
      let q = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', uid)
        .eq('is_read', false)
        .eq('is_quarantined', false);
      const blocked = notInBlocked();
      if (blocked) q = q.not('sender_id', 'in', blocked);
      const { count } = await q;
      if (!cancelled) setNotificationCounts({ unreadMessages: count || 0 });
    };

    // Sparks tab badge: new incoming Sparks (mutual matches start as one) plus, for members who can
    // open the Views tab (visitorAccess), new profile views since Sparks was last opened.
    const refreshUnseenSparks = async (uid: string) => {
      if (pathRef.current?.startsWith('/favorites')) return setNotificationCounts({ unseenSparks: 0 });
      const since = sparksSeenAt();
      const blocked = notInBlocked();
      let sparksQ = supabase.from('sparks').select('id', { count: 'exact', head: true }).eq('receiver_id', uid).gt('created_at', since);
      if (blocked) sparksQ = sparksQ.not('sender_id', 'in', blocked);
      let viewsQ = supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('viewed_id', uid).neq('viewer_id', uid).gt('created_at', since);
      if (blocked) viewsQ = viewsQ.not('viewer_id', 'in', blocked);
      const [sparks, views] = await Promise.all([sparksQ, visitorAccess ? viewsQ : Promise.resolve({ count: 0 })]);
      if (!cancelled) setNotificationCounts({ unseenSparks: (sparks.count || 0) + (views.count || 0) });
    };

    const fetchActor = async (id: string): Promise<Actor | null> => {
      const { data } = await supabase
        .from('profiles')
        .select('username, display_name, full_name, avatar_url')
        .eq('id', id)
        .maybeSingle();
      return data;
    };

    const showNotificationToast = async (t: NotificationToastData) => {
      if (cancelled) return;
      setToast(t);
      // The server writes a notifications row for this event; the header chip re-reads shortly.
      window.setTimeout(() => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT)), 1500);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([20, 60, 20]);
        } catch {}
      }

      // Background tab: native alert, unless this device already gets web push (no duplicates).
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden' &&
        alertPrefs.browserAlertsEnabled() &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        let hasPush = false;
        try {
          const reg = await navigator.serviceWorker?.getRegistration();
          hasPush = Boolean(await reg?.pushManager.getSubscription());
        } catch {}
        if (!hasPush) {
          try {
            const n = new Notification(t.name, { body: t.preview, icon: t.avatarUrl || '/icon-192.png', tag: t.key, silent: true });
            n.onclick = () => {
              window.focus();
              router.push(t.href);
              n.close();
            };
          } catch {}
        }
      }
    };

    const refreshAll = (uid: string) => {
      void loadBlocks(uid).then(() => {
        if (cancelled || subscribedUid !== uid) return;
        refreshUnreadMessages(uid);
        refreshUnseenSparks(uid);
      });
    };

    const subscribe = async (uid: string) => {
      // getSession() and a SIGNED_IN event both fire on load. subscribedUid is claimed before the
      // first await, so the second call returns instead of opening a duplicate channel.
      if (subscribedUid === uid) return;
      subscribedUid = uid;
      if (channel) {
        const old = channel;
        channel = null;
        await supabase.removeChannel(old);
      }

      const [{ data: me }] = await Promise.all([
        supabase.from('profiles').select('is_plus, gender').eq('id', uid).maybeSingle(),
        loadBlocks(uid),
      ]);
      // Unmounted, signed out or switched member while we waited: open nothing.
      if (cancelled || subscribedUid !== uid) return;
      visitorAccess = Boolean(me?.is_plus) || me?.gender === 'female';
      refreshUnreadMessages(uid);
      refreshUnseenSparks(uid);

      channel = supabase
        .channel(`realtime-user-notifications-${uid}`)
        // Any new notifications row for me (announcements, verification results, staff alerts):
        // refresh the account dropdown's unread chip. Toasts come from the source tables below.
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
          () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
        )
        // A. messages
        .on(
          'postgres_changes',
          // No Postgres filter string (brittle with realtime + RLS): RLS already limits rows to my own
          // conversations, and the receiver check below keeps only messages sent TO me.
          { event: '*', schema: 'public', table: 'messages' },
          async (payload) => {
            const row = (payload.new || {}) as { id: string; sender_id: string; receiver_id?: string; content?: string | null; is_quarantined?: boolean | null; audio_path?: string | null };
            const old = (payload.old || {}) as { receiver_id?: string };
            if (row.receiver_id !== uid && old.receiver_id !== uid) return;
            refreshUnreadMessages(uid);
            if (payload.eventType !== 'INSERT' || row.receiver_id !== uid) return;
            if (!row.sender_id || row.is_quarantined || blockedIds.has(row.sender_id)) return;
            const actor = await fetchActor(row.sender_id);
            // Only that exact conversation, open and on screen, swallows the toast. Discover, Sparks,
            // Profile, the /messages inbox, other chats or a background tab all still notify.
            const open = (pathRef.current || '').match(/^\/(?:chat|messages)\/([^/?#]+)/)?.[1];
            const openKey = open ? decodeURIComponent(open).replace(/^@+/, '').toLowerCase() : null;
            const onThatChat =
              openKey !== null &&
              (openKey === row.sender_id.toLowerCase() || openKey === String(actor?.username || '').toLowerCase());
            if (onThatChat && document.visibilityState === 'visible') return;
            showNotificationToast({
              key: `m-${row.id}`,
              kind: 'message',
              actorId: row.sender_id,
              name: actorName(actor, 'New message'),
              avatarUrl: actor?.avatar_url ?? null,
              // Contact details stay hidden in previews, as in a locked chat.
              preview: row.audio_path ? 'Voice note' : applyContactRevealMask(String(row.content || ''), 0).text || 'Sent you a message',
              href: `/chat/${row.sender_id}`,
            });
          }
        )
        // B + C. Sparks (sparks.receiver_id is the person sparked)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'sparks', filter: `receiver_id=eq.${uid}` },
          async (payload) => {
            const row = payload.new as { id: string; sender_id: string };
            if (!row?.sender_id || blockedIds.has(row.sender_id)) return;
            const [{ data: mine }, actor] = await Promise.all([
              supabase.from('sparks').select('id').eq('sender_id', uid).eq('receiver_id', row.sender_id).maybeSingle(),
              fetchActor(row.sender_id),
            ]);
            const name = actorName(actor, 'Someone');
            const mutual = Boolean(mine);
            if (!pathRef.current?.startsWith('/favorites')) {
              setNotificationCounts({ unseenSparks: getNotificationCounts().unseenSparks + 1 });
            }
            const kind: NotificationKind = mutual ? 'mutual' : 'spark';
            showNotificationToast({
              key: `s-${row.id}`,
              kind,
              actorId: row.sender_id,
              name: mutual ? `It's a Mutual Spark with ${name}!` : name,
              avatarUrl: actor?.avatar_url ?? null,
              preview: mutual ? 'Tap to send the first message' : `${name} sparked you!`,
              href: mutual ? `/chat/${row.sender_id}` : '/favorites',
            });
          }
        )
        // D. profile visits (Visitor History members only)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'profile_views', filter: `viewed_id=eq.${uid}` },
          async (payload) => {
            if (!visitorAccess) return;
            const row = payload.new as { id: string; viewer_id: string };
            if (!row?.viewer_id || row.viewer_id === uid || blockedIds.has(row.viewer_id)) return;
            if (!pathRef.current?.startsWith('/favorites')) {
              setNotificationCounts({ unseenSparks: getNotificationCounts().unseenSparks + 1 });
            }
            const actor = await fetchActor(row.viewer_id);
            const name = actorName(actor, 'Someone');
            showNotificationToast({
              key: `v-${row.id}`,
              kind: 'visit',
              actorId: row.viewer_id,
              name,
              avatarUrl: actor?.avatar_url ?? null,
              preview: `${name} viewed your profile`,
              href: '/favorites',
            });
          }
        )
        // Events sent while the socket was down (tab suspended, network drop) are not replayed, so
        // every (re)subscribe re-reads the badges from the database.
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' && !cancelled && subscribedUid === uid) refreshAll(uid);
        });
    };

    // Back from the background or back online: badges may be stale.
    const onResume = () => {
      if (document.visibilityState === 'visible' && subscribedUid && !cancelled) refreshAll(subscribedUid);
    };
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('online', onResume);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user) subscribe(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) subscribe(session.user.id);
      if (!session?.user) {
        if (channel) supabase.removeChannel(channel);
        channel = null;
        subscribedUid = null;
        blockedIds = new Set();
        setToast(null);
        setNotificationCounts({ unreadMessages: 0, unseenSparks: 0 });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('online', onResume);
      if (channel) supabase.removeChannel(channel);
      channel = null;
    };
  }, [router]);

  return (
    <NotificationToast
      toast={toast}
      onClose={closeToast}
      onOpen={(t) => {
        setToast(null);
        router.push(t.href);
      }}
    />
  );
}

export default RealtimeNotifier;
