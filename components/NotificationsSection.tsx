'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Zap, MessageSquare, Eye, Heart, ShieldCheck, ShieldAlert, BadgeCheck } from 'lucide-react';

type Notification = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  actor?: { id?: string; username?: string; avatar_url?: string } | null;
};

const TYPE_META: Record<string, { icon: any; line: (n: Notification) => string; route: (n: Notification) => string }> = {
  spark_received: {
    icon: Zap,
    line: (n) => `${n.actor?.username ?? 'Someone'} sparked your profile`,
    route: () => '/favorites?tab=you-sparked'
  },
  mutual_match: {
    icon: Heart,
    line: (n) => `You and ${n.actor?.username ?? 'someone'} matched`,
    route: () => '/favorites?tab=mutual'
  },
  message: {
    icon: MessageSquare,
    line: (n) => `${n.actor?.username ?? 'Someone'} sent you a message`,
    route: (n) => `/chat/${n.actor?.id ?? ''}`
  },
  profile_visit: {
    icon: Eye,
    line: (n) => {
      const count = Number(n.payload.count ?? 1);
      return count > 1
        ? `${n.actor?.username ?? 'Someone'} and ${count - 1} other${count > 2 ? 's' : ''} viewed your profile`
        : `${n.actor?.username ?? 'Someone'} viewed your profile`;
    },
    route: (n) => `/profile/${n.actor?.username ?? n.actor?.id ?? ''}`
  },
  photo_verified:  { icon: ShieldCheck, line: () => 'Photo verification approved', route: () =>'/settings' },
  location_verified:{ icon: BadgeCheck,  line: () => 'Location verified', route: () => '/settings' },
  plus_activated:   { icon: ShieldCheck, line: () => 'AIL+ activated', route: () => '/settings'},
  moderation_warning:{ icon: ShieldAlert, line: (n) => String(n.payload.reason ?? 'Warning issued'), route: () => '/settings' }
};

// DB constraint uses favorite/match/spark/visit - alias them to the metas above
TYPE_META['favorite'] = TYPE_META.spark_received;
TYPE_META['spark'] = TYPE_META.spark_received;
TYPE_META['match'] = TYPE_META.mutual_match;
TYPE_META['visit'] = TYPE_META.profile_visit;

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

interface NotificationsSectionProps {
  onNavigate?: () => void;
}

export default function NotificationsSection({ onNavigate }: NotificationsSectionProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : { notifications: [], unread_count: 0 })
      .then(d => { setNotifications(d.notifications); setUnread(d.unread_count); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = (n: Notification) => {
    fetch('/api/notifications', { method: 'POST' }).catch(() => {});
    setUnread(0);
    setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
    const meta = TYPE_META[n.type];
    if (meta && onNavigate) onNavigate();
    if (meta) router.push(meta.route(n));
  };

  if (loading) return null;
  if (notifications.length === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9A79BA]">
          <Bell size={13} strokeWidth={2} />
          Notifications
        </span>
        {unread > 0 && <span className="text-[10px] font-semibold text-[#6555B8]">{unread} new</span>}
      </div>
      <div className="mx-2 mb-2 flex max-h-[240px] flex-col gap-1.5 overflow-y-auto rounded-xl border border-[#9A8CC3]/25 bg-white/70 p-1.5">
        {notifications.slice(0, 5).map(n => {
          const meta = TYPE_META[n.type];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <button
              key={n.id}
              onClick={() => handleOpen(n)}
              className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                n.is_read ? 'bg-transparent' : 'bg-[#F3EFFC]'
              }`}
            >
              <Icon size={15} strokeWidth={2} className={`mt-0.5 shrink-0 ${n.is_read ? 'text-black/40' : 'text-[#6555B8]'}`} />
              <span className="min-w-0 flex-1">
                <span className={`block text-[12.5px] leading-snug ${n.is_read ? 'text-black/50' : 'text-black/80 font-medium'}`}>
                  {meta.line(n)}
                </span>
                <span className="block text-[10px] text-black/35">{timeAgo(n.created_at)}</span>
              </span>
            </button>
          );
        })}
        {notifications.length > 5 && (
          <button onClick={() => { router.push('/notifications'); onNavigate?.(); }} className="px-2 py-1 text-[11px] font-semibold text-[#6555B8]">
            View all
          </button>
        )}
      </div>
    </>
  );
}