"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ClipboardList,
  Factory,
  Grid2x2,
  Headphones,
  Heart,
  Menu,
  Package,
  Search,
  Send,
  X,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/BrandMark";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { COMPARE_EVENT, readCompare } from "@/lib/compare-store";

type HeaderSession = { name?: string; email?: string; roles?: string[] };

const secondaryLinks = [
  { href: "/products", key: "search", icon: Search, labelEn: "Search", labelAr: "بحث" },
  { href: "/categories", key: "categories", icon: Grid2x2, labelEn: "Categories", labelAr: "التصنيفات" },
  {
    href: "/products",
    key: "productsServices",
    icon: Package,
    labelEn: "Products & services",
    labelAr: "المنتجات والخدمات",
  },
  { href: "/vendors", key: "suppliers", icon: Building2, labelEn: "Suppliers", labelAr: "الموردون" },
  {
    href: "/vendors?companyType=manufacturer",
    key: "manufacturers",
    icon: Factory,
    labelEn: "Manufacturers",
    labelAr: "المصانع",
  },
  {
    href: "/contact",
    key: "sourcing",
    icon: Headphones,
    labelEn: "Get sourcing help",
    labelAr: "مساعدة التوريد",
  },
] as const;

function readSavedCount() {
  try {
    const raw = localStorage.getItem("kt_saved_products");
    if (!raw) return 0;
    const map = JSON.parse(raw) as Record<string, unknown>;
    return Object.keys(map || {}).length;
  } catch {
    return 0;
  }
}

function readInterestCount() {
  try {
    const raw = localStorage.getItem("kt_product_interests");
    if (!raw) return 0;
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.length : 0;
  } catch {
    return 0;
  }
}

export function SiteHeader({ locale, overlay = false }: { locale: Locale; overlay?: boolean }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [sessionUser, setSessionUser] = useState<HeaderSession | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [navExpanded, setNavExpanded] = useState(false);
  /** Center logo bar: visible at top + whenever user scrolls upward. */
  const [logoVisible, setLogoVisible] = useState(true);
  const navExpandedRef = useRef(false);
  const logoVisibleRef = useRef(true);
  const lastScrollY = useRef(0);
  const isAr = locale === "ar";

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.add("kt-public");
    document.documentElement.style.colorScheme = "light";
  }, []);

  // Desktop: hide logo on scroll-down; show center logo again on scroll-up / at top.
  // Logo is always fixed on desktop + spacer in flow → no layout flicker.
  useEffect(() => {
    if (overlay) return;

    let ticking = false;
    const TOP = 20;

    const sync = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      const desktop = window.matchMedia("(min-width: 1024px)").matches;

      const nextExpanded = desktop && y > 56;
      let nextVisible = logoVisibleRef.current;

      if (!desktop || y <= TOP) {
        nextVisible = true;
      } else if (delta > 6) {
        nextVisible = false;
      } else if (delta < -6) {
        nextVisible = true;
      }

      if (nextExpanded !== navExpandedRef.current) {
        navExpandedRef.current = nextExpanded;
        setNavExpanded(nextExpanded);
      }
      if (nextVisible !== logoVisibleRef.current) {
        logoVisibleRef.current = nextVisible;
        setLogoVisible(nextVisible);
      }

      lastScrollY.current = y;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sync);
    };

    lastScrollY.current = window.scrollY;
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [overlay]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j?.success) {
          if (!cancelled) setSessionUser(null);
          return;
        }
        const u = j.data?.user || j.data?.session || null;
        if (!cancelled) setSessionUser(u);
      })
      .catch(() => {
        if (!cancelled) setSessionUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const sync = () => {
      setSavedCount(readSavedCount());
      const interests = readInterestCount();
      const compare = readCompare().length;
      setRequestCount(Math.max(interests, compare));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(COMPARE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(COMPARE_EVENT, sync);
    };
  }, [pathname]);

  const accountHref = (() => {
    const roles = sessionUser?.roles || [];
    if (roles.some((r) => ["admin", "super_admin"].includes(r))) return `/${locale}/admin`;
    if (roles.some((r) => String(r).startsWith("vendor"))) return `/${locale}/vendor/dashboard`;
    return `/${locale}/buyer/dashboard`;
  })();

  useEffect(() => {
    if (!open && !closing) return;
    const prev = document.body.style.overflow;
    if (prev !== "hidden") document.body.style.overflow = "hidden";
    return () => {
      if (prev !== "hidden") document.body.style.overflow = prev;
    };
  }, [open, closing]);

  const closeSidebar = () => {
    if (!open || closing) return;
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 420);
  };

  const toggleSidebar = () => {
    if (open) closeSidebar();
    else setOpen(true);
  };

  const labelFor = (link: (typeof secondaryLinks)[number]) =>
    isAr ? link.labelAr : link.labelEn;

  return (
    <>
      {/* Holds vertical space under the fixed desktop logo (prevents jump). */}
      {!overlay ? <div className="hukum-header__top-spacer" aria-hidden /> : null}

      {/* Logo / actions — hides on scroll-down; center logo returns on scroll-up. */}
      <header
        className={cn(
          "hukum-header hukum-header__top z-50",
          overlay && "hukum-header--overlay fixed inset-x-0 top-0",
          !overlay && (logoVisible ? "is-logo-shown" : "is-logo-hidden")
        )}
      >
        <div className="container-custom hukum-header__top-inner">
          <div className="hukum-header__side hukum-header__side--start">
            <LanguageSwitcher locale={locale} variant="soft" />
          </div>

          <Link href={`/${locale}`} className="hukum-header__brand" aria-label="Hukum">
            <BrandMark size={36} />
            <BrandWordmark size="md" className="!text-[#111C17]" />
          </Link>

          <div className="hukum-header__side hukum-header__side--end">
            <Link
              href={`/${locale}/buyer/saved`}
              className="hukum-header__icon-btn"
              aria-label={isAr ? "المحفوظات" : "Wishlist"}
              title={isAr ? "المحفوظات" : "Wishlist"}
            >
              <Heart size={18} strokeWidth={1.75} />
              {savedCount > 0 ? (
                <span className="hukum-header__badge">{savedCount > 9 ? "9+" : savedCount}</span>
              ) : null}
            </Link>

            <Link
              href={`/${locale}/rfq`}
              className="hukum-header__icon-btn"
              aria-label={isAr ? "طلبات عروض الأسعار" : "Quote requests"}
              title={isAr ? "طلبات عروض الأسعار" : "Quote requests"}
            >
              <ClipboardList size={18} strokeWidth={1.75} />
              {requestCount > 0 ? (
                <span className="hukum-header__badge">{requestCount > 9 ? "9+" : requestCount}</span>
              ) : null}
            </Link>

            {sessionUser ? (
              <Link
                href={accountHref}
                className="hukum-header__signin hidden sm:inline-flex"
                title={sessionUser.name || sessionUser.email || (isAr ? "حسابي" : "Account")}
              >
                {sessionUser.name || (isAr ? "حسابي" : "Account")}
              </Link>
            ) : (
              <Link href={`/${locale}/login`} className="hukum-header__signin hidden sm:inline-flex">
                {isAr ? "تسجيل الدخول" : "Sign in"}
              </Link>
            )}

            <Link href={`/${locale}/rfq`} className="hukum-header__cta hidden md:inline-flex">
              <Send size={14} strokeWidth={2} aria-hidden />
              {isAr ? "اطلب عروض أسعار" : "Request quotes"}
            </Link>

            <button
              type="button"
              className="hukum-header__menu-btn lg:hidden"
              onClick={toggleSidebar}
              aria-label={t("nav.menu")}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Secondary nav is a sibling so sticky can pin for the full page scroll. */}
      {!overlay ? (
        <nav
          className={cn(
            "hukum-header__nav hidden lg:block",
            navExpanded && "is-scrolled",
            logoVisible && "has-logo"
          )}
          aria-label="Primary"
        >
          <div className="container-custom">
            <ul className="hukum-header__nav-list">
              {secondaryLinks.map((link) => {
                const href = `/${locale}${link.href}`;
                const pathOnly = href.split("?")[0];
                const active =
                  pathname === pathOnly ||
                  (link.href !== "/products" && pathname.startsWith(pathOnly));
                const Icon = link.icon;
                return (
                  <li key={link.key}>
                    <Link
                      href={href}
                      className={cn("hukum-header__nav-link", active && "is-active")}
                    >
                      <Icon
                        size={navExpanded ? 17 : 15}
                        strokeWidth={1.75}
                        aria-hidden
                        className="hukum-header__nav-icon"
                      />
                      {labelFor(link)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      ) : null}

      {(open || closing) && (
        <div
          className={cn(
            "fixed inset-0 z-[60] bg-black/40 transition-opacity duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
            closing ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
          onClick={closeSidebar}
          aria-hidden
        />
      )}

      {(open || closing) && (
        <aside
          className={cn(
            "fixed top-0 z-[70] flex h-svh w-[min(86vw,380px)] flex-col bg-white text-[#111C17] transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
            isAr ? "left-0" : "right-0",
            closing
              ? cn("opacity-0", isAr ? "-translate-x-full" : "translate-x-full")
              : "translate-x-0 opacity-100"
          )}
          style={{ boxShadow: "0 20px 60px rgba(16, 37, 28, 0.18)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="flex items-center justify-between border-b border-[#E9EEEA] px-5 py-4">
            <Link href={`/${locale}`} onClick={closeSidebar} className="flex items-center gap-2" aria-label="Hukum">
              <BrandMark size={30} />
              <BrandWordmark size="sm" className="!text-[#111C17]" />
            </Link>
            <button
              type="button"
              onClick={closeSidebar}
              className="rounded-md p-2 text-[#111C17] hover:bg-[#F3F5F4]"
              aria-label={t("nav.close")}
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-5 pt-4">
            <LanguageSwitcher locale={locale} variant="soft" />
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
            {secondaryLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.key}
                  href={`/${locale}${link.href}`}
                  onClick={closeSidebar}
                  className="inline-flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-[#111C17] hover:bg-[#F3F5F4]"
                >
                  <Icon size={17} strokeWidth={1.75} className="text-[#17634B]" />
                  {labelFor(link)}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-[#E9EEEA] p-4">
            {sessionUser ? (
              <Link
                href={accountHref}
                onClick={closeSidebar}
                className="flex w-full items-center justify-center rounded-full border border-[#E9EEEA] px-4 py-3 text-sm font-semibold"
              >
                {sessionUser.name || (isAr ? "حسابي" : "Account")}
              </Link>
            ) : (
              <Link
                href={`/${locale}/login`}
                onClick={closeSidebar}
                className="flex w-full items-center justify-center rounded-full border border-[#E9EEEA] px-4 py-3 text-sm font-semibold"
              >
                {isAr ? "تسجيل الدخول" : "Sign in"}
              </Link>
            )}
            <Link
              href={`/${locale}/rfq`}
              onClick={closeSidebar}
              className="hukum-header__cta flex w-full items-center justify-center"
            >
              <Send size={14} strokeWidth={2} aria-hidden />
              {isAr ? "اطلب عروض أسعار" : "Request quotes"}
            </Link>
          </div>
        </aside>
      )}
    </>
  );
}
