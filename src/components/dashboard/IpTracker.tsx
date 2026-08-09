"use client";

import { useEffect } from "react";

/** Einmal pro Session: echte IP serverseitig speichern. */
export function IpTracker() {
  useEffect(() => {
    const key = "stella_ip_tracked";
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    void fetch("/api/session/track", { method: "POST" });
  }, []);

  return null;
}
