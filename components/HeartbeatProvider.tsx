"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { joinPresence, leavePresence } from "@/lib/realtimePresence";

// Must stay well inside lib/presence ONLINE_WINDOW_MINUTES (5) so active members never flicker offline.
const HEARTBEAT_MS = 2 * 60 * 1000;

export default function HeartbeatProvider() {
  useEffect(() => {
    let first = true;
    let cancelled = false;
    const sendHeartbeat = async () => {
      if (document.visibilityState !== "visible") return;
      // Signed-out visitors have nothing to report (the route would answer 401): read the local session first, no
      // network round trip. This also keeps the one-time session-start flag for the first ping that can use it.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      // The first ping of this session also lets the server notice a login from a new country.
      const headers: Record<string, string> = first ? { "x-session-start": "1" } : {};
      first = false;
      fetch("/api/user/heartbeat", { method: "POST", headers }).catch(() => {
        // Fail silently on network drops
      });
    };

    // Ping once on mount, then every 2 minutes while visible
    const ping = () => void sendHeartbeat();
    ping();
    const interval = setInterval(ping, HEARTBEAT_MS);
    window.addEventListener("focus", ping);
    document.addEventListener("visibilitychange", ping);

    // Live presence: everyone listens; only members with "Show active status" on are tracked.
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
      window.removeEventListener("focus", ping);
      document.removeEventListener("visibilitychange", ping);
      leavePresence();
    };
  }, []);

  return null;
}
