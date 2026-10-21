export interface PresenceState {
  isOnline: boolean;
  statusLabel: string;
}

/**
 * Derives user presence from the last_active timestamp.
 * Defaults to a 15-minute active window.
 */
export function getPresenceStatus(
  lastActive: string | null | undefined,
  thresholdMinutes: number = 15
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

  if (diffMinutes <= thresholdMinutes) {
    return { isOnline: true, statusLabel: "Online" };
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