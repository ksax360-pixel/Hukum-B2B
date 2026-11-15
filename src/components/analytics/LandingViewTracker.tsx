"use client";

import { useEffect } from "react";
import { track } from "@/lib/track-client";
import { FUNNEL_EVENTS } from "@/lib/funnel-events";

/** Fires buyer funnel step 1: landing_view (once per session). */
export function LandingViewTracker() {
  useEffect(() => {
    try {
      const key = "kt_landing_viewed";
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      void track({ type: FUNNEL_EVENTS.landing_view, meta: { surface: "home" } });
    } catch {
      void track({ type: FUNNEL_EVENTS.landing_view, meta: { surface: "home" } });
    }
  }, []);
  return null;
}
