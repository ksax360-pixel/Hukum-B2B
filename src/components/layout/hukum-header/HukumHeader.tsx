"use client";

import "./hh.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  ChevronDown,
  CircleHelp,
  Factory,
  Flag,
  GitCompare,
  HardHat,
  Headphones,
  HeartPulse,
  HelpCircle,
  Hotel,
  Info,
  LifeBuoy,
  LogIn,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  Send,
  Shapes,
  Shield,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Store,
  Truck,
  Upload,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { BrandMark } from "@/components/brand/BrandMark";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { sourcingWhatsAppHref } from "@/lib/sourcing-contact";
import { cn } from "@/lib/utils";
import {
  HIGHLIGHT,
  HOW_ITEMS,
  LEGAL_LINKS,
  NAV_LABELS,
  OTHERS_ITEMS,
  SECTORS,
  SOURCING_ITEMS,
  VENDOR_ITEMS,
  t,
  type HeaderLocale,
} from "./data";

type MenuKey = "categories" | "vendors" | "sourcing" | "how" | "others" | "account" | null;

type HeaderSession = { name?: string; email?: string; roles?: string[] };

const ICONS: Record<string, LucideIcon> = {
  BadgeCheck,
  Briefcase,
  Building2,
  Factory,
  Flag,
  GitCompare,
  HardHat,
  HeartPulse,
  HelpCircle,
  Hotel,
  Info,
  LifeBuoy,
  LogIn,
  Mail,
  MapPin,
  MessageCircle,
  Search,
  Send,
  Shield,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Store,
  Truck,
  Upload,
  Users,
};

const STROKE = 1.75;

function locPath(locale: Locale, href: string) {
  if (href.startsWith("http") || href.startsWith("//")) return href;
  const [path, hash] = href.split("#");
  const [pathname, query] = path.split("?");
  const base = `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  return `${base}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

function MenuRow({
  href,
  icon: Icon,
  title,
  description,
  external,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  external?: boolean;
  onNavigate?: () => void;
}) {
  const className = "hh-row";
  const body = (
    <>
      <span className="hh-row__icon" aria-hidden>
        <Icon size={16} strokeWidth={STROKE} />
      </span>
      <span className="hh-row__text">
        <span className="hh-row__title">{title}</span>
        {description ? <span className="hh-row__desc">{description}</span> : null}
      </span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onNavigate}>
      {body}
    </Link>
  );
}

function DropdownShell({
  id,
  open,
  children,
}: {
  id: string;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      role="menu"
      className={cn("hh-panel", open && "is-open")}
      aria-hidden={!open}
    >
      {children}
    </div>
  );
}

export function HukumHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAr = locale === "ar";
  const L = locale as HeaderLocale;
  const baseId = useId();

  const [sessionUser, setSessionUser] = useState<HeaderSession | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [compressed, setCompressed] = useState(() => /^\/(en|ar)\/?$/.test(pathname || ""));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [vendorQuery, setVendorQuery] = useState("");

  const rootRef = useRef<HTMLElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j?.success) {
          if (!cancelled) setSessionUser(null);
          return;
        }
        setSessionUser(j.data?.user || j.data?.session || null);
      })
      .catch(() => {
        if (!cancelled) setSessionUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
    setMobileSection(null);
  }, [pathname]);

  useEffect(() => {
    const onHome = /^\/(en|ar)\/?$/.test(pathname || "");
    const scroller = document.querySelector<HTMLElement>(".home-snap-scroller");
    const onScroll = () => {
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      if (!desktop) {
        setCompressed(false);
        return;
      }
      // Homepage snap uses a compact header so panels stay one screen tall.
      if (onHome) {
        setCompressed(true);
        return;
      }
      const y = scroller ? scroller.scrollTop : window.scrollY;
      setCompressed(y > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    scroller?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      scroller?.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (!openMenu && !mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [openMenu, mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const openOnHover = (key: MenuKey) => {
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setOpenMenu(key), 60);
  };

  const closeOnLeave = () => {
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setOpenMenu(null), 160);
  };

  const toggleMenu = (key: MenuKey) => {
    setOpenMenu((prev) => (prev === key ? null : key));
  };

  const closeAll = useCallback(() => {
    setOpenMenu(null);
    setMobileOpen(false);
    setMobileSection(null);
  }, []);

  const accountHref = (() => {
    const roles = sessionUser?.roles || [];
    if (roles.some((r) => ["admin", "super_admin"].includes(r))) return `/${locale}/admin`;
    if (roles.some((r) => String(r).startsWith("vendor"))) return `/${locale}/vendor/dashboard`;
    return `/${locale}/buyer/dashboard`;
  })();

  const logout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
      credentials: "include",
    });
    setSessionUser(null);
    closeAll();
    router.refresh();
  };

  const waHref = sourcingWhatsAppHref(locale);

  const onVendorSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = vendorQuery.trim();
    closeAll();
    router.push(q ? `/${locale}/vendors?q=${encodeURIComponent(q)}` : `/${locale}/vendors`);
  };

  const navItems: {
    key: Exclude<MenuKey, "account" | null>;
    label: string;
    Icon: LucideIcon;
  }[] = [
    { key: "categories", label: t(L, NAV_LABELS.categories.en, NAV_LABELS.categories.ar), Icon: Shapes },
    { key: "vendors", label: t(L, NAV_LABELS.vendors.en, NAV_LABELS.vendors.ar), Icon: Search },
    { key: "sourcing", label: t(L, NAV_LABELS.sourcing.en, NAV_LABELS.sourcing.ar), Icon: Headphones },
    { key: "how", label: t(L, NAV_LABELS.howItWorks.en, NAV_LABELS.howItWorks.ar), Icon: CircleHelp },
    { key: "others", label: t(L, NAV_LABELS.others.en, NAV_LABELS.others.ar), Icon: Menu },
  ];

  const panelId = (key: string) => `${baseId}-${key}`;

  const onTriggerKey = (e: ReactKeyboardEvent, key: MenuKey) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpenMenu(key);
    }
  };

  const requestQuotesLabel = t(L, NAV_LABELS.requestQuotes.en, NAV_LABELS.requestQuotes.ar);
  const signInLabel = sessionUser
    ? sessionUser.name || t(L, NAV_LABELS.account.en, NAV_LABELS.account.ar)
    : t(L, NAV_LABELS.signIn.en, NAV_LABELS.signIn.ar);

  const categoriesPanel = (
    <div className="hh-stack">
      {SECTORS.map((s) => {
        const Icon = ICONS[s.icon] || Briefcase;
        return (
          <MenuRow
            key={s.slug}
            href={locPath(locale, `/categories/${s.slug}`)}
            icon={Icon}
            title={t(L, s.en, s.ar)}
            onNavigate={closeAll}
          />
        );
      })}
      <div className="hh-divider" aria-hidden />
      <MenuRow
        href={locPath(locale, "/categories")}
        icon={Shapes}
        title={t(L, NAV_LABELS.viewAllCategories.en, NAV_LABELS.viewAllCategories.ar)}
        onNavigate={closeAll}
      />
    </div>
  );

  const vendorsPanel = (
    <div className="hh-stack">
      <form className="hh-search" onSubmit={onVendorSearch}>
        <Search size={14} strokeWidth={STROKE} aria-hidden />
        <input
          type="search"
          value={vendorQuery}
          onChange={(e) => setVendorQuery(e.target.value)}
          placeholder={t(L, NAV_LABELS.searchVendors.en, NAV_LABELS.searchVendors.ar)}
          aria-label={t(L, NAV_LABELS.searchVendors.en, NAV_LABELS.searchVendors.ar)}
        />
      </form>
      {VENDOR_ITEMS.map((item) => {
        const Icon = ICONS[item.icon] || Building2;
        return (
          <MenuRow
            key={item.href}
            href={locPath(locale, item.href)}
            icon={Icon}
            title={t(L, item.en, item.ar)}
            onNavigate={closeAll}
          />
        );
      })}
    </div>
  );

  const sourcingPanel = (
    <div className="hh-stack">
      {SOURCING_ITEMS.map((item) => {
        const Icon = ICONS[item.icon] || Send;
        const href = item.href === "__whatsapp__" ? waHref : locPath(locale, item.href);
        const external = item.href === "__whatsapp__" ? !href.startsWith("/") : item.external;
        return (
          <MenuRow
            key={item.en}
            href={href}
            icon={Icon}
            title={t(L, item.en, item.ar)}
            external={external}
            onNavigate={closeAll}
          />
        );
      })}
      <div className="hh-highlight" role="note">
        {t(L, HIGHLIGHT.en, HIGHLIGHT.ar)}
      </div>
    </div>
  );

  const howPanel = (
    <div className="hh-stack">
      {HOW_ITEMS.map((item) => {
        const Icon = ICONS[item.icon] || HelpCircle;
        return (
          <MenuRow
            key={item.href}
            href={locPath(locale, item.href)}
            icon={Icon}
            title={t(L, item.en, item.ar)}
            onNavigate={closeAll}
          />
        );
      })}
    </div>
  );

  const othersPanel = (
    <div className="hh-stack">
      {OTHERS_ITEMS.map((item) => {
        const Icon = ICONS[item.icon] || Info;
        return (
          <MenuRow
            key={item.href}
            href={locPath(locale, item.href)}
            icon={Icon}
            title={t(L, item.en, item.ar)}
            onNavigate={closeAll}
          />
        );
      })}
      <div className="hh-legal" role="group" aria-label={isAr ? "قانوني" : "Legal"}>
        {LEGAL_LINKS.map((link, i) => (
          <span key={link.href} className="hh-legal__item">
            {i > 0 ? <span className="hh-legal__dot" aria-hidden>
              ·
            </span> : null}
            <Link href={locPath(locale, link.href)} onClick={closeAll}>
              {t(L, link.en, link.ar)}
            </Link>
          </span>
        ))}
      </div>
    </div>
  );

  const panelFor = (key: Exclude<MenuKey, "account" | null>) => {
    switch (key) {
      case "categories":
        return categoriesPanel;
      case "vendors":
        return vendorsPanel;
      case "sourcing":
        return sourcingPanel;
      case "how":
        return howPanel;
      case "others":
        return othersPanel;
    }
  };

  const desktopNav = (
    <ul className="hh-nav">
      {navItems.map(({ key, label, Icon }) => {
        const open = openMenu === key;
        return (
          <li
            key={key}
            className="hh-nav__item"
            onMouseEnter={() => openOnHover(key)}
            onMouseLeave={closeOnLeave}
          >
            <button
              type="button"
              className={cn("hh-nav__btn", open && "is-open")}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-controls={panelId(key)}
              onClick={() => toggleMenu(key)}
              onKeyDown={(e) => onTriggerKey(e, key)}
            >
              <Icon size={15} strokeWidth={STROKE} className="hh-nav__icon" aria-hidden />
              <span className="hh-nav__label">{label}</span>
              <ChevronDown size={12} strokeWidth={STROKE} className="hh-nav__chevron" aria-hidden />
            </button>
            <DropdownShell id={panelId(key)} open={open}>
              <div
                dir={isAr ? "rtl" : "ltr"}
                onMouseEnter={() => {
                  clearHoverTimer();
                  setOpenMenu(key);
                }}
                onMouseLeave={closeOnLeave}
              >
                {panelFor(key)}
              </div>
            </DropdownShell>
          </li>
        );
      })}
    </ul>
  );

  const accountMenu = sessionUser ? (
    <div
      className="hh-account"
      onMouseEnter={() => openOnHover("account")}
      onMouseLeave={closeOnLeave}
    >
      <button
        type="button"
        className={cn("hh-icon-btn", openMenu === "account" && "is-open")}
        aria-label={signInLabel}
        aria-expanded={openMenu === "account"}
        aria-haspopup="menu"
        onClick={() => toggleMenu("account")}
      >
        <User size={18} strokeWidth={STROKE} aria-hidden />
      </button>
      <DropdownShell id={panelId("account")} open={openMenu === "account"}>
        <div className="hh-stack">
          <MenuRow
            href={accountHref}
            icon={User}
            title={signInLabel}
            description={sessionUser.email}
            onNavigate={closeAll}
          />
          <button type="button" className="hh-row" onClick={() => void logout()}>
            <span className="hh-row__icon" aria-hidden>
              <LogIn size={16} strokeWidth={STROKE} />
            </span>
            <span className="hh-row__text">
              <span className="hh-row__title">{isAr ? "تسجيل الخروج" : "Sign out"}</span>
            </span>
          </button>
        </div>
      </DropdownShell>
    </div>
  ) : (
    <Link
      href={`/${locale}/login`}
      className="hh-icon-btn"
      aria-label={t(L, NAV_LABELS.signIn.en, NAV_LABELS.signIn.ar)}
      title={t(L, NAV_LABELS.signIn.en, NAV_LABELS.signIn.ar)}
    >
      <User size={18} strokeWidth={STROKE} aria-hidden />
    </Link>
  );

  const ctaBtn = (
    <Link href={locPath(locale, "/request-quotes")} className="hh-cta" onClick={closeAll}>
      <Send size={14} strokeWidth={2} aria-hidden />
      <span>{requestQuotesLabel}</span>
    </Link>
  );

  return (
    <>
      <div className={cn("hh-spacer", compressed && "is-compressed")} aria-hidden />
      <header
        ref={rootRef}
        className={cn("hh", compressed && "is-compressed", isAr && "is-ar")}
        dir="ltr"
      >
        <div className="hh__desktop">
          <div className="hh__row1">
            <div className="hh__inner hh__row1-inner">
              <div className="hh__side hh__side--start">
                <LanguageSwitcher locale={locale} variant="soft" />
              </div>
              <Link href={`/${locale}`} className="hh__brand hh__brand--lg" aria-label="Hukum">
                <BrandMark size={44} />
              </Link>
              {!compressed ? (
                <div className="hh__side hh__side--end">
                  {accountMenu}
                  {ctaBtn}
                </div>
              ) : (
                <div className="hh__side hh__side--end" aria-hidden />
              )}
            </div>
          </div>
          <div className="hh__row2">
            <div className="hh__inner hh__row2-inner">
              {compressed ? (
                <Link href={`/${locale}`} className="hh__brand hh__brand--sm" aria-label="Hukum">
                  <BrandMark size={40} />
                </Link>
              ) : null}
              {desktopNav}
              {compressed ? (
                <div className="hh__side hh__side--end">
                  {accountMenu}
                  {ctaBtn}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hh__mobile">
          <div className="hh__inner hh__mobile-inner">
            <Link href={`/${locale}`} className="hh__brand" aria-label="Hukum">
              <BrandMark size={36} />
            </Link>
            <div className="hh__side hh__side--end">
              {sessionUser ? (
                <Link href={accountHref} className="hh-icon-btn" aria-label={signInLabel}>
                  <User size={18} strokeWidth={STROKE} aria-hidden />
                </Link>
              ) : (
                <Link
                  href={`/${locale}/login`}
                  className="hh-icon-btn"
                  aria-label={t(L, NAV_LABELS.signIn.en, NAV_LABELS.signIn.ar)}
                >
                  <User size={18} strokeWidth={STROKE} aria-hidden />
                </Link>
              )}
              {ctaBtn}
              <button
                type="button"
                className="hh-icon-btn"
                aria-label={t(L, NAV_LABELS.menu.en, NAV_LABELS.menu.ar)}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={20} strokeWidth={STROKE} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {mobileOpen ? (
          <div
            className="hh-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t(L, NAV_LABELS.menu.en, NAV_LABELS.menu.ar)}
          >
            <div className="hh-sheet__head">
              <BrandMark size={36} />
              <button
                type="button"
                className="hh-icon-btn"
                aria-label={t(L, NAV_LABELS.close.en, NAV_LABELS.close.ar)}
                onClick={() => setMobileOpen(false)}
              >
                <X size={18} strokeWidth={STROKE} />
              </button>
            </div>
            <div className="hh-sheet__body" dir={isAr ? "rtl" : "ltr"}>
              {navItems.map(({ key, label, Icon }) => {
                const expanded = mobileSection === key;
                return (
                  <div key={key} className="hh-sheet__section">
                    <button
                      type="button"
                      className={cn("hh-sheet__trigger", expanded && "is-open")}
                      aria-expanded={expanded}
                      onClick={() => setMobileSection(expanded ? null : key)}
                    >
                      <Icon size={15} strokeWidth={STROKE} aria-hidden />
                      <span>{label}</span>
                      <ChevronDown
                        size={14}
                        strokeWidth={STROKE}
                        className="hh-sheet__chevron"
                        aria-hidden
                      />
                    </button>
                    {expanded ? <div className="hh-sheet__panel">{panelFor(key)}</div> : null}
                  </div>
                );
              })}
            </div>
            <div className="hh-sheet__foot" dir="ltr">
              <LanguageSwitcher locale={locale} variant="soft" />
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}
