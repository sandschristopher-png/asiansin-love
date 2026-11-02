"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { joinPresence, leavePresence } from "@/lib/realtimePresence";

// Must stay well inside lib/presence ONLINE_WINDOW_MINUTES (5) so active members never flicker offline.
const HEARTBEAT_MS = 2 * 60 * 1000;

export default function HeartbeatProvider() {
  useEffect(() => {
    const sendHeartbeat = () => {
      if (document.visibilityState === "visible") {
        fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {
          // Fail silently on network drops
        });
      }
    };

    // Ping once on mount, then every 2 minutes while visible
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_MS);
    window.addEventListener("focus", sendHeartbeat);
    document.addEventListener("visibilitychange", sendHeartbeat);

    // Live presence: everyone listens; only members with "Show active status" on are tracked.
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: me } = await supabase
        .from("profiles")
        .select("show_active_status")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      joinPresence(user.id, { track: me?.show_active_status !== false });
    })();

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", sendHeartbeat);
      document.removeEventListener("visibilitychange", sendHeartbeat);
      leavePresence();
    };
  }, []);

  return null;
}
