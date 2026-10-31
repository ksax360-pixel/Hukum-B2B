"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Splash } from "./Splash";
import type { Locale } from "@/i18n/config";

export function SplashGate({ locale }: { locale: Locale }) {
  const pathname = usePathname() || "";
  const isHome = /^\/(en|ar)\/?$/.test(pathname);
  const [done, setDone] = useState(false);

  if (!isHome || done) return null;
  return <Splash locale={locale} onComplete={() => setDone(true)} />;
}
