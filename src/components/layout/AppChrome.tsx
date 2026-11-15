"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { FeedbackHost } from "@/components/ui/Feedback";
import { HukumHeader } from "@/components/layout/hukum-header";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SplashGate } from "@/components/splash/SplashGate";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { CustomerChatbot } from "@/components/chat/CustomerChatbot";
import { CompareTray } from "@/components/compare/CompareTray";
import type { Locale } from "@/i18n/config";
import type { ReactNode } from "react";

function isAuthPath(pathname: string) {
  return /\/(login|register)(\/|$)/.test(pathname);
}

function isDashPath(pathname: string) {
  if (/\/vendor\/sign-in(\/|$)/.test(pathname)) return false;
  return /\/(admin|buyer|vendor)(\/|$)/.test(pathname);
}

function isHomePath(pathname: string) {
  return /^\/(en|ar)\/?$/.test(pathname);
}

/** Supplier microsite: the supplier's own header and footer replace Hukum's (a Hukum ribbon stays on top). */
function isVendorMicrositePath(pathname: string) {
  return /^\/(en|ar)\/vendors\/(?!cities|brands|made-in-saudi|manufacturers)[^/]+\/?$/.test(pathname);
}

export function AppChrome({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const pathname = usePathname() || "";
  const auth = isAuthPath(pathname);
  const dash = isDashPath(pathname);
  const home = isHomePath(pathname);
  const microsite = isVendorMicrositePath(pathname);

  useEffect(() => {
    if (!dash) {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.add("kt-public");
    } else {
      document.documentElement.classList.remove("kt-public");
    }
  }, [dash]);

  const showChat = !auth && !dash;
  const showTabBar = !auth && !dash && !microsite;

  return (
    <QueryProvider>
      <FeedbackHost locale={locale} />
      {auth ? (
        <div className="kt-public-root min-h-screen bg-white">{children}</div>
      ) : dash ? (
        <div className="kt-admin-root min-h-screen">{children}</div>
      ) : home ? (
        // Homepage scrolls like every other page (snap panels felt like "jumping between slides").
        <div className="kt-public-root hukum-site min-h-screen flex flex-col bg-white text-[var(--hukum-ink,#111C17)]">
          <SplashGate locale={locale} />
          <HukumHeader locale={locale} />
          <main className="flex-1 home-flow">{children}</main>
          <SiteFooter locale={locale} />
          {showTabBar ? <MobileTabBar locale={locale} /> : null}
          {showChat ? <CustomerChatbot locale={locale} /> : null}
          <CompareTray locale={locale} />
        </div>
      ) : microsite ? (
        <div className="kt-public-root hukum-site min-h-screen bg-white text-[var(--hukum-ink,#111C17)]">
          {children}
          {showChat ? <CustomerChatbot locale={locale} /> : null}
          <CompareTray locale={locale} />
        </div>
      ) : (
        <div className="kt-public-root hukum-site min-h-screen flex flex-col bg-white text-[var(--hukum-ink,#111C17)]">
          <HukumHeader locale={locale} />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale} />
          {showTabBar ? <MobileTabBar locale={locale} /> : null}
          {showChat ? <CustomerChatbot locale={locale} /> : null}
          <CompareTray locale={locale} />
        </div>
      )}
    </QueryProvider>
  );
}
