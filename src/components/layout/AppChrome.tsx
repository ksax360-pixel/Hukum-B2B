"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { HukumHeader } from "@/components/layout/hukum-header";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SplashGate } from "@/components/splash/SplashGate";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { CustomerChatbot } from "@/components/chat/CustomerChatbot";
import { CompareTray } from "@/components/compare/CompareTray";
import { HomeSnapScroller } from "@/components/home/HomeSnapScroller";
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

/** Seller microsite — uses its own header (mockup storefront), not HukumHeader. */
function isVendorMicrositePath(pathname: string) {
  return /^\/(en|ar)\/vendors\/[^/]+\/?$/.test(pathname);
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
  const vendorSite = isVendorMicrositePath(pathname);

  useEffect(() => {
    if (!dash) {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.add("kt-public");
    } else {
      document.documentElement.classList.remove("kt-public");
    }
  }, [dash]);

  // Homepage: lock document scroll; snap lives on .home-snap-scroller.
  useEffect(() => {
    if (!home) {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.documentElement.classList.remove("home-snap-active");
      return;
    }
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("home-snap-active");
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.documentElement.classList.remove("home-snap-active");
    };
  }, [home]);

  const showChat = !auth && !dash;

  return (
    <QueryProvider>
      {auth ? (
        <div className="kt-public-root min-h-screen bg-white">{children}</div>
      ) : dash ? (
        <div className="kt-admin-root min-h-screen">{children}</div>
      ) : home ? (
        <div className="kt-public-root home-snap-shell relative flex flex-col bg-white text-[#111C17]">
          <SplashGate locale={locale} />
          <HukumHeader locale={locale} />
          <HomeSnapScroller>
            <main className="home-snap-main">{children}</main>
            <div className="home-snap-section home-snap-section--footer">
              <SiteFooter locale={locale} />
            </div>
          </HomeSnapScroller>
          {showChat ? <CustomerChatbot locale={locale} /> : null}
          {!dash ? <CompareTray locale={locale} /> : null}
        </div>
      ) : vendorSite ? (
        <div className="kt-public-root hukum-site min-h-screen bg-[var(--hukum-surface-soft,#F4F4F4)] text-[var(--hukum-ink,#111C17)]">
          {children}
          {showChat ? <CustomerChatbot locale={locale} /> : null}
          <CompareTray locale={locale} />
        </div>
      ) : (
        <div className="kt-public-root hukum-site min-h-screen flex flex-col bg-white text-[var(--hukum-ink,#111C17)]">
          <HukumHeader locale={locale} />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale} />
          {showChat ? <CustomerChatbot locale={locale} /> : null}
          <CompareTray locale={locale} />
        </div>
      )}
    </QueryProvider>
  );
}
