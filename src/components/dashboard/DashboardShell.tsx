"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, ChevronDown, Compass, LogOut, Menu, Moon, Sun, Ticket, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/BrandMark";
import { enrichNav, segmentNav } from "@/data/dashboard-nav";
import { OnboardingTourProvider, useOnboardingTour } from "@/components/dashboard/OnboardingTour";
import { requestTourReplay } from "@/lib/product-tour";
import { dashNavLabel, dashRoleTitle, dashT } from "@/i18n/dash-copy";

type NavItem = { href: string; label: string };

const THEME_KEY = "kt.dashboard.theme";

function useDashTheme(enabled: boolean) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (!enabled) {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.add("kt-public");
      return;
    }
    const saved = localStorage.getItem(THEME_KEY);
    const next = saved === "dark" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.classList.remove("kt-public");
    return () => {
      document.documentElement.classList.add("kt-public");
    };
  }, [enabled]);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return { theme, toggle };
}

export function DashboardShell({
  locale,
  title,
  nav,
  children,
  allowDark = true,
}: {
  locale: string;
  title: string;
  nav: NavItem[];
  children: ReactNode;
  allowDark?: boolean;
}) {
  const role = title.toLowerCase() === "admin" ? "admin" : title.toLowerCase() === "vendor" ? "vendor" : "buyer";
  // Buyer workspace is light only for now (dark mode used a different, blue palette).
  const darkOk = allowDark && role !== "buyer";
  const homePath = `/${locale}${nav[0]?.href || ""}`;
  const [user, setUser] = useState<{ id?: string; email?: string; name?: string } | null>(null);
  const [vendorSlug, setVendorSlug] = useState<string | undefined>();

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((j) => {
        const session = j?.data?.session;
        const profile = j?.data?.user;
        if (session) {
          setUser({
            id: session.id,
            email: session.email,
            name: profile?.name || session.email?.split("@")[0],
          });
        }
        if (j?.data?.vendorSlug) setVendorSlug(String(j.data.vendorSlug));
      })
      .catch(() => setUser({ email: "guest", name: "Guest" }));
  }, []);

  return (
    <OnboardingTourProvider role={role} user={user} homePath={homePath} locale={locale}>
      <DashboardChrome
        locale={locale}
        title={title}
        nav={nav}
        allowDark={darkOk}
        role={role}
        user={user}
        vendorSlug={vendorSlug}
      >
        {children}
      </DashboardChrome>
    </OnboardingTourProvider>
  );
}

function DashboardChrome({
  locale,
  title,
  nav,
  children,
  allowDark,
  role,
  user,
  vendorSlug,
}: {
  locale: string;
  title: string;
  nav: NavItem[];
  children: ReactNode;
  allowDark: boolean;
  role: "buyer" | "vendor" | "admin";
  user: { id?: string; email?: string; name?: string } | null;
  vendorSlug?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useDashTheme(allowDark);
  const dark = theme === "dark";
  const { startTour } = useOnboardingTour();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const items = enrichNav(nav).map((item) => ({
    ...item,
    label: dashNavLabel(locale, item.href, item.label),
  }));
  const segments = segmentNav(items);
  const ticketHref = `/${locale}/${role}/tickets`;
  const roleTitle = dashRoleTitle(locale, title);
  // Longest matching nav href wins, so "/admin/vendors" isn't titled by its "/admin" parent.
  const activeItem = items
    .filter((item) => {
      const href = `/${locale}${item.href}`;
      return pathname === href || pathname.startsWith(`${href}/`);
    })
    .sort((a, b) => b.href.length - a.href.length)[0];
  const pageTitle = activeItem?.label || title;
  const websiteHref = `/${locale}/vendors/${vendorSlug || "riyadh-safety-supplies-demo"}`;

  async function logout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push(`/${locale}/login`);
    router.refresh();
  }

  const sidebar = (
    <>
      <div className={cn("mb-2 border-b px-3 pb-6", dark ? "border-slate-700/50" : "border-[var(--hukum-border)]")}>
        <div className="flex flex-col items-center gap-2">
          <BrandMark size={44} />
        </div>
        <p className={cn("mt-3 text-center text-[13px] font-medium", dark ? "text-white/50" : "text-[var(--hukum-muted)]")}>
          {role === "vendor" ? (locale === "ar" ? "مساحة المورد" : "Supplier workspace") : dashT(locale, `${title} workspace`)}
        </p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto py-2.5 px-2" data-onboarding="navigation">
        {segments.map((seg, i) => (
          <div key={i}>
            {seg.map((item) => {
              const href = `/${locale}${item.href}`;
              const active = pathname === href || (item.href !== `/${role}` && item.href !== `/${role}/dashboard` && pathname.startsWith(`${href}/`));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={href}
                  data-onboarding={item.onboarding}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 transition-all",
                    active
                      ? dark
                        ? "bg-slate-700/40 text-white"
                        : "bg-[#17634B]/[0.08] text-[var(--hukum-green)]"
                      : dark
                        ? "text-slate-300 hover:bg-slate-800/40 hover:text-white"
                        : "text-[var(--hukum-muted)] hover:bg-[#17634B]/[0.05] hover:text-[var(--hukum-green)]",
                  )}
                >
                  <span
                    className="grid h-7 w-7 place-items-center rounded-md"
                    style={dark ? { backgroundColor: active ? "#0075FF" : "#1A1F37" } : undefined}
                  >
                    <Icon size={14} strokeWidth={1.7} />
                  </span>
                  <span className="text-[14px] font-medium">{item.label}</span>
                  {active ? (
                    <span className={cn("absolute inset-y-0 start-0 w-1 rounded-e", dark ? "bg-[#0075FF]" : "bg-[var(--hukum-green)]")} />
                  ) : null}
                </Link>
              );
            })}
            {i < segments.length - 1 ? <div className={cn("mx-3 my-3 h-px", dark ? "bg-slate-700/50" : "bg-[var(--hukum-border)]")} /> : null}
          </div>
        ))}
      </nav>
      <div className="mt-auto px-2 pt-2">
        <button
          type="button"
          data-onboarding="help"
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
            dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-[var(--hukum-muted)] hover:bg-[var(--hukum-surface)] hover:text-[var(--hukum-ink)]",
          )}
          onClick={() => {
            requestTourReplay();
            startTour({ force: true });
          }}
        >
          <Compass size={16} aria-hidden />
          {dashT(locale, "Take the tour")}
        </button>
      </div>
    </>
  );

  return (
    <div className="kt-admin-root relative flex min-h-screen">
      <aside className="dash-sidebar fixed top-0 start-0 z-40 hidden h-screen w-56 shrink-0 flex-col overflow-y-auto px-3 py-5 lg:flex">
        <div
          className="pointer-events-none absolute end-0 top-0 bottom-0 w-px"
          style={{
            background: dark
              ? "linear-gradient(180deg, rgba(0, 117, 255, 0.45) 0%, rgba(0, 117, 255, 0.08) 100%)"
              : "linear-gradient(180deg, rgba(23, 99, 75, 0.32) 0%, rgba(23, 99, 75, 0.04) 100%)",
          }}
        />
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-[#111C17]/35" aria-label={dashT(locale, "Close menu")} onClick={() => setMobileOpen(false)} />
          <aside className="dash-sidebar relative flex h-full w-56 flex-col overflow-y-auto px-3 py-5">{sidebar}</aside>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col lg:ms-56">
        <header className="dash-header" data-onboarding="header">
          <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" className="grid h-11 w-11 place-items-center rounded-xl lg:hidden" onClick={() => setMobileOpen(true)} aria-label={dashT(locale, "Open menu")}>
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{pageTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {allowDark ? (
                <button type="button" className="dash-chip" onClick={toggle} aria-label={dashT(locale, "Toggle theme")}>
                  {dark ? <Sun size={14} /> : <Moon size={14} />}
                  <span className="hidden sm:inline">{dark ? dashT(locale, "Light") : dashT(locale, "Dark")}</span>
                </button>
              ) : null}
              <button type="button" className="dash-chip" data-onboarding="alerts">
                <Bell size={14} />
                <span className="hidden sm:inline">{dashT(locale, "Alerts")}</span>
              </button>
              {role === "buyer" ? (
                <Link href={`/${locale}/rfq`} className="dash-chip dash-chip--primary hidden sm:inline-flex">
                  {dashT(locale, "New request")}
                </Link>
              ) : null}
              {role === "vendor" ? (
                <Link href={websiteHref} target="_blank" className="dash-chip hidden lg:inline-flex" data-onboarding="website">
                  {dashT(locale, "View your website")}
                </Link>
              ) : (
                <Link href={`/${locale}`} className="dash-chip hidden lg:inline-flex">
                  {dashT(locale, "Marketplace")}
                </Link>
              )}
              <div className="relative">
                <button type="button" className="dash-chip" onClick={() => setMenuOpen((v) => !v)}>
                  <span className={cn("grid h-5 w-5 place-items-center rounded-full", dark ? "bg-white/10" : "bg-[#17634B]/10 text-[var(--hukum-green)]")}>
                    <User size={12} />
                  </span>
                  <span className="hidden max-w-[110px] truncate md:inline">{user?.name || dashT(locale, "Account")}</span>
                  <ChevronDown size={11} className={menuOpen ? "rotate-180" : ""} />
                </button>
                {menuOpen ? (
                  <div className="dash-account-menu absolute end-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl">
                    <div className="dash-account-menu__head px-5 py-4">
                      <p className="truncate text-sm font-medium">{user?.name || dashT(locale, "Account")}</p>
                      <p className="truncate text-[11px] opacity-50">{user?.email || ""}</p>
                    </div>
                    <p className="px-5 pt-3 text-[12px] font-medium opacity-50">{dashT(locale, "Need help")}</p>
                    <Link href={ticketHref} className="flex w-full items-center gap-3 px-5 py-3 text-[14px] font-medium opacity-80" onClick={() => setMenuOpen(false)}>
                      <Ticket size={14} />
                      {dashT(locale, "Raise a ticket")}
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-5 py-3 text-[14px] font-medium opacity-80"
                      onClick={() => {
                        setMenuOpen(false);
                        requestTourReplay();
                        startTour({ force: true });
                      }}
                    >
                      {dashT(locale, "Product tour")}
                    </button>
                    <button type="button" className="flex w-full items-center gap-3 px-5 py-3 text-[14px] font-medium text-[#D21F1F]" onClick={() => void logout()}>
                      <LogOut size={14} />
                      {dashT(locale, "Sign out")}
                    </button>
                  </div>
                ) : null}
              </div>
              {mobileOpen ? (
                <button type="button" className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label={dashT(locale, "Close")}>
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </div>
        </header>
        <main className="mb-8 flex-1 px-4 pt-[4.75rem] pb-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function MetricGrid({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8" data-onboarding="dashboard-metrics">
      {items.map((m) => (
        <div key={m.label} id="cardColor" className="dash-metric">
          <p className="label-caps mb-2">{m.label}</p>
          <p className="text-2xl font-semibold tracking-tight">{m.value}</p>
        </div>
      ))}
    </div>
  );
}
