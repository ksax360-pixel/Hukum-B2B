"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
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
  return /\/(admin|buyer|vendor)(\/|$)/.test(pathname);
}

function isHomePath(pathname: string) {
  return /^\/(en|ar)\/?$/.test(pathname);
}

/** Seller microsite — uses its own header (mockup storefront), not SiteHeader. */
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

  // Homepage uses normal document scroll (reference design), not snap-lock.
  useEffect(() => {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }, [home]);

  const showChat = !auth && !dash;

  return (
    <QueryProvider>
      {auth ? (
        <div className="kt-public-root min-h-screen bg-white">{children}</div>
      ) : dash ? (
        <div className="kt-admin-root min-h-screen">{children}</div>
      ) : home ? (
        <div className="kt-public-root relative flex min-h-screen flex-col bg-white text-[#111C17]">
          <SplashGate locale={locale} />
          <SiteHeader locale={locale} />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale} />
          {showChat ? <CustomerChatbot locale={locale} /> : null}
          {!dash ? <CompareTray locale={locale} /> : null}
        </div>
      ) : vendorSite ? (
        <div className="kt-public-root min-h-screen bg-[#f8f8f8] text-[#001730]">
          {children}
          {showChat ? <CustomerChatbot locale={locale} /> : null}
          <CompareTray locale={locale} />
        </div>
      ) : (
        <div className="kt-public-root min-h-screen flex flex-col bg-white text-[#001730]">
          <SiteHeader locale={locale} />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale} />
          {showChat ? <CustomerChatbot locale={locale} /> : null}
          <CompareTray locale={locale} />
        </div>
      )}
    </QueryProvider>
  );
}
