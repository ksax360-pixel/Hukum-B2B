"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashT } from "@/i18n/dash-copy";

const nav = [
  { href: "/vendor/dashboard", label: "Dashboard" },
  { href: "/vendor/company", label: "Company" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/ai-upload", label: "AI Upload" },
  { href: "/vendor/rfqs", label: "RFQs" },
  { href: "/vendor/quotations", label: "Quotations" },
  { href: "/vendor/analytics", label: "Analytics" },
  { href: "/vendor/documents", label: "Documents" },
  { href: "/vendor/subscription", label: "Subscription" },
  { href: "/vendor/settings", label: "Settings" },
];

type Plan = {
  key: string;
  name: { en: string; ar?: string };
  chargeSar: number;
  priceSar: number;
  vatIncluded: boolean;
  blurb: { en: string; ar?: string };
  matrix: Record<string, string>;
};

function priceLabel(p: Plan, isAr: boolean) {
  if (!p.chargeSar) return isAr ? "٠ ر.س" : "SAR 0";
  if (p.vatIncluded) {
    return isAr
      ? `${p.chargeSar.toLocaleString()} ر.س / شهر شامل الضريبة`
      : `SAR ${p.chargeSar.toLocaleString()} / mo incl. VAT`;
  }
  return isAr
    ? `${p.priceSar} ر.س / شهر + ضريبة (الإجمالي ${p.chargeSar})`
    : `SAR ${p.priceSar} / mo + VAT (total SAR ${p.chargeSar})`;
}

export default function VendorSubscriptionPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState("free");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetch("/api/monetisation?resource=plans", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setPlans(j.data?.plans || []);
      })
      .catch(() => undefined);
    fetch("/api/monetisation?resource=me", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCurrent(j.data?.planKey || "free");
      })
      .catch(() => undefined);
  }, []);

  async function subscribe(plan: string) {
    setBusy(plan);
    setMsg("");
    try {
      const res = await fetch("/api/monetisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "subscribe", plan }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setCurrent(plan);
      setMsg(
        isAr
          ? `تم تفعيل ${plan}`
          : `${plan} activated${json.data?.chargeSar != null ? ` · SAR ${json.data.chargeSar}` : ""}`
      );
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <DashboardShell locale={locale} title={dashT(locale, "Vendor")} nav={nav}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">{isAr ? "الاشتراك" : "Subscription"}</h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "مجاني · ذهبي (٣٢٠ + ضريبة = ٣٦٨) · مميز (٤٠٠٠ شامل الضريبة)."
            : "Free · Gold (SAR 320 + VAT = 368) · Premium (SAR 4,000 incl. VAT)."}
        </p>
        <p className="text-sm text-[var(--muted)]">
          {isAr ? "خطتك الحالية:" : "Current plan:"}{" "}
          <span className="font-semibold capitalize text-[var(--ink)]">{current}</span>
        </p>
      </div>
      {msg ? <p className="mb-3 text-sm text-[var(--gold,#c9a962)]">{msg}</p> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.key} className="surface-card flex flex-col p-5">
            <p className="m-0 text-xs uppercase text-[var(--muted)]">
              {isAr ? p.name.ar || p.name.en : p.name.en}
            </p>
            <p className="mt-2 mb-0 text-xl font-semibold">{priceLabel(p, isAr)}</p>
            <p className="mt-2 mb-4 text-sm text-[var(--muted)]">
              {isAr ? p.blurb.ar || p.blurb.en : p.blurb.en}
            </p>
            <ul className="m-0 mb-4 list-disc space-y-1 ps-4 text-xs text-[var(--muted)]">
              {Object.values(p.matrix || {}).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-primary mt-auto text-sm"
              disabled={busy === p.key || current === p.key}
              onClick={() => void subscribe(p.key)}
            >
              {busy === p.key ? "…" : current === p.key ? (isAr ? "الخطة الحالية" : "Current") : isAr ? "تفعيل" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
