"use client";

import { useEffect } from "react";

export default function HeartbeatProvider() {
  useEffect(() => {
    const sendHeartbeat = () => {
      if (document.visibilityState === "visible") {
        fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {
          // Fail silently on network drops
        });
      }
    };

    // Ping once on mount
    sendHeartbeat();

    // Ping every 5 minutes while active
    const interval = setInterval(sendHeartbeat, 5 * 60 * 1000);
    window.addEventListener("focus", sendHeartbeat);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", sendHeartbeat);
    };
  }, []);

  return null;
}