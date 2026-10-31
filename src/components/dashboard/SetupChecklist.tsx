"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { dashT } from "@/i18n/dash-copy";

type Item = { id: string; label: string; href: string };

const BUYER: Item[] = [
  { id: "rfq", label: "Create your first RFQ", href: "/rfq" },
  { id: "products", label: "Browse products", href: "/products" },
  { id: "vendors", label: "Find a verified vendor", href: "/vendors" },
  { id: "org", label: "Complete organization details", href: "/buyer/organization" },
];

const VENDOR: Item[] = [
  { id: "company", label: "Complete your company profile", href: "/vendor/company" },
  { id: "product", label: "Publish your first product", href: "/vendor/products" },
  { id: "website", label: "Review your public vendor page", href: "/vendor/dashboard" },
  { id: "analytics", label: "Open analytics", href: "/vendor/analytics" },
];

const ADMIN: Item[] = [
  { id: "vendors", label: "Review pending vendor verification", href: "/admin/vendors" },
  { id: "products", label: "Moderate new product listings", href: "/admin/products" },
  { id: "health", label: "Check system health", href: "/admin/health" },
  { id: "analytics", label: "Check marketplace analytics", href: "/admin/analytics" },
];

export function SetupChecklist({ locale, role }: { locale: string; role: "buyer" | "vendor" | "admin" }) {
  const storageKey = `kt.setup.${role}`;
  const items = role === "vendor" ? VENDOR : role === "admin" ? ADMIN : BUYER;
  const [state, setState] = useState({ completed: {} as Record<string, boolean>, dismissed: false });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setState(JSON.parse(raw) as { completed: Record<string, boolean>; dismissed: boolean });
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [storageKey]);

  const persist = (next: typeof state) => {
    setState(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const doneCount = useMemo(() => items.filter((i) => state.completed[i.id]).length, [items, state.completed]);
  if (!ready || state.dismissed) return null;
  const progress = items.length ? (doneCount / items.length) * 100 : 0;
  const nextItem = items.find((i) => !state.completed[i.id]);

  return (
    <section className="setup-checklist" data-onboarding="setup">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#071D27]/45">
            {role === "vendor" ? dashT(locale, "Vendor onboarding") : role === "admin" ? dashT(locale, "Admin onboarding") : dashT(locale, "Buyer onboarding")}
          </p>
          <h2 className="mt-0.5 text-[13px] font-semibold tracking-tight text-[#071D27] sm:truncate">
            {doneCount === items.length
              ? dashT(locale, "Your workspace is ready.")
              : dashT(locale, "Let’s get you ready to use the dashboard.")}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="text-[10px] tabular-nums tracking-[0.12em] text-[#071D27]/55">
            {String(doneCount).padStart(2, "0")}
            <span className="text-[#071D27]/35"> / </span>
            {String(items.length).padStart(2, "0")}
          </p>
          <button type="button" className="text-[10px] uppercase tracking-[0.16em] text-[#071D27]/55" onClick={() => persist({ ...state, dismissed: true })}>
            {dashT(locale, "Dismiss")}
          </button>
        </div>
      </div>
      <div className="mt-2.5 h-px overflow-hidden bg-[#071D27]/12" aria-hidden>
        <div className="h-full bg-[#6b7a80] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      {nextItem ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-[#071D27]/65">
            {locale === "ar" ? "التالي" : "Next"}: <strong className="font-semibold text-[#071D27]">{dashT(locale, nextItem.label)}</strong>
          </p>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}${nextItem.href}`} className="dash-chip !h-8">
              {dashT(locale, "Open")}
            </Link>
            <button
              type="button"
              className="dash-chip !h-8"
              onClick={() => persist({ ...state, completed: { ...state.completed, [nextItem.id]: true } })}
            >
              <Check size={12} />
              {dashT(locale, "Done")}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2.5 text-[11px] text-[#071D27]/55">
          {locale === "ar" ? "اكتملت التهيئة. يمكنك إخفاء هذا في أي وقت." : "Setup is complete. You can hide this anytime."}
        </p>
      )}
    </section>
  );
}
