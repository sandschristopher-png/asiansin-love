export interface PresenceState {
  isOnline: boolean;
  statusLabel: string;
}

/** "Online" window. HeartbeatProvider refreshes last_active every 2 minutes while a tab is visible. */
export const ONLINE_WINDOW_MINUTES = 5;

/**
 * Derives user presence from the last_active timestamp (online = within the last 5 minutes).
 * Pair with usePresentUserIds() from lib/realtimePresence for live connections.
 */
export function getPresenceStatus(
  lastActive: string | null | undefined,
  thresholdMinutes: number = ONLINE_WINDOW_MINUTES
): PresenceState {
  if (!lastActive) {
    return { isOnline: false, statusLabel: "Offline" };
  }

  const lastActiveDate = new Date(lastActive);
  const diffMs = Date.now() - lastActiveDate.getTime();

  if (isNaN(diffMs)) {
    return { isOnline: false, statusLabel: "Offline" };
  }

  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < thresholdMinutes) {
    return { isOnline: true, statusLabel: "Online" };
  }

  if (diffMinutes < 1) {
    return { isOnline: false, statusLabel: 'Active just now' };
  }

  if (diffMinutes < 60) {
    return { isOnline: false, statusLabel: `Active ${diffMinutes}m ago` };
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return { isOnline: false, statusLabel: `Active ${diffHours}h ago` };
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return { isOnline: false, statusLabel: "Active yesterday" };
  }

  return { isOnline: false, statusLabel: `Active ${diffDays}d ago` };
}