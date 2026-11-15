"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { Splash } from "./Splash";
import type { Locale } from "@/i18n/config";

const SPLASH_KEY = "hukum_splash_seen";

function hasSeenSplash() {
  try {
    return sessionStorage.getItem(SPLASH_KEY) === "1";
  } catch {
    return true;
  }
}

function markSplashSeen() {
  try {
    sessionStorage.setItem(SPLASH_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function SplashGate({ locale: _locale }: { locale: Locale }) {
  const pathname = usePathname() || "";
  const isHome = /^\/(en|ar)\/?$/.test(pathname);
  const [show, setShow] = useState(false);

  useLayoutEffect(() => {
    if (!isHome) {
      setShow(false);
      return;
    }
    if (hasSeenSplash()) {
      setShow(false);
      return;
    }
    markSplashSeen();
    setShow(true);
  }, [isHome]);

  if (!isHome || !show) return null;

  return <Splash onComplete={() => setShow(false)} />;
}
