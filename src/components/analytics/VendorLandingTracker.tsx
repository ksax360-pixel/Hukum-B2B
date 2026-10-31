"use client";

import { useEffect } from "react";
import { track } from "@/lib/track-client";
import { FUNNEL_EVENTS } from "@/lib/funnel-events";

export function VendorLandingTracker({ vendorId }: { vendorId?: string }) {
  useEffect(() => {
    if (!vendorId) return;
    void track({
      type: FUNNEL_EVENTS.vendor_landing_view,
      vendorId,
      meta: { surface: "vendor_page" },
    });
  }, [vendorId]);
  return null;
}
