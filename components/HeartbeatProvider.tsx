"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { joinPresence, leavePresence, presenceActive } from "@/lib/realtimePresence";

// Must stay well inside lib/presence ONLINE_WINDOW_MINUTES (5) so active members never flicker offline.
const HEARTBEAT_MS = 2 * 60 * 1000;
/** focus and visibilitychange usually fire together on return to the tab: one ping per window is enough. */
const MIN_GAP_MS = 10_000;

export default function HeartbeatProvider() {
  useEffect(() => {
    let cancelled = false;
    let first = true;
    let lastPingAt = 0;

    const sendHeartbeat = async () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastPingAt < MIN_GAP_MS) return;
      lastPingAt = now; // claimed before awaiting, so a second event in the same instant is dropped
      // Signed-out visitors have nothing to report (the route would answer 401): read the local session first, no
      // network round trip. This also keeps the one-time session-start flag for the first ping that can use it.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) {
        lastPingAt = 0; // nothing was sent: a sign-in a moment later may ping at once
        return;
      }
      // The first ping of this session also lets the server notice a login from a new country.
      const headers: Record<string, string> = first ? { "x-session-start": "1" } : {};
      first = false;
      fetch("/api/user/heartbeat", { method: "POST", headers }).catch(() => {
        // Fail silently on network drops
      });
    };
    const ping = () => void sendHeartbeat();

    // Ping once on mount, then every 2 minutes while visible
    ping();
    const interval = setInterval(ping, HEARTBEAT_MS);
    window.addEventListener("focus", ping);
    document.addEventListener("visibilitychange", ping);

    // Live presence: everyone listens; only members with "Show active status" on are tracked. Joined at load for a
    // signed-in member, and again after a sign-in that happens without a page reload.
    const startPresence = async () => {
      if (presenceActive()) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || cancelled || presenceActive()) return;
      const { data: me } = await supabase.from("profiles").select("show_active_status").eq("id", user.id).maybeSingle();
      if (cancelled) return;
      joinPresence(user.id, { track: me?.show_active_status !== false });
    };
    void startPresence();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      // Deferred: calling back into supabase.auth from inside this callback can deadlock its session lock.
      if (event === "SIGNED_IN") {
        setTimeout(() => {
          if (cancelled) return;
          void startPresence();
          ping();
        }, 0);
      }
      if (event === "SIGNED_OUT") {
        leavePresence();
        first = true; // the next member to sign in on this tab gets a fresh session-start ping
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearInterval(interval);
      window.removeEventListener("focus", ping);
      document.removeEventListener("visibilitychange", ping);
      leavePresence();
    };
  }, []);

  return null;
}
