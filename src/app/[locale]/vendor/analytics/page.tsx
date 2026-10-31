"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell, MetricGrid } from "@/components/dashboard/DashboardShell";
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

type Rollup = {
  kpis?: Record<string, number | string>;
  totals?: Record<string, number | string>;
  series?: Array<{ label?: string; date?: string; views?: number; contacts?: number }>;
  categories?: Array<{ name?: string; count?: number }>;
  cities?: Array<{ name?: string; count?: number }>;
};

export default function VendorAnalyticsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [data, setData] = useState<Rollup | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/seller-analytics?range=30d", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message || "Failed");
        setData(j.data as Rollup);
      })
      .catch((e) => setError(e.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const k = data?.kpis || data?.totals || {};
  const series = data?.series || [];
  const max = Math.max(1, ...series.map((d) => Number(d.views) || 0));
  const cities = data?.cities || [];
  const cats = data?.categories || [];

  return (
    <DashboardShell locale={locale} title="Vendor" nav={nav}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Analytics")}</h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "أداء الواجهة والطلبات والعروض — آخر 30 يوماً."
            : "Storefront, leads, and quote performance — last 30 days."}
        </p>
      </div>

      {error ? <p className="mb-4 text-sm text-[var(--accent)]">{error}</p> : null}
      {loading ? <div className="skeleton h-24" /> : null}

      {!loading ? (
        <MetricGrid
          items={[
            { label: isAr ? "زيارات الواجهة" : "Storefront views", value: String(k.storefrontViews ?? k.views ?? 0) },
            { label: isAr ? "تواصل / عملاء" : "Contacts / leads", value: String(k.leads ?? k.contacts ?? 0) },
            { label: isAr ? "عروض الأسعار" : "Quotations", value: String(k.quotations ?? k.quotes ?? 0) },
            { label: isAr ? "معدل الرد" : "Response rate", value: String(k.responseRate ?? k.conversion ?? "—") },
          ]}
        />
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <p className="label-caps mb-4">{isAr ? "الزيارات" : "Views series"}</p>
          {series.length ? (
            <>
              <div className="dash-spark">
                {series.map((d, i) => (
                  <span
                    key={d.label || d.date || i}
                    title={`${d.label || d.date}: ${d.views || 0}`}
                    style={{ height: `${Math.round(((Number(d.views) || 0) / max) * 100)}%` }}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="m-0 text-sm text-[var(--muted)]">{isAr ? "لا بيانات بعد" : "No series data yet"}</p>
          )}
        </div>

        <div className="surface-card p-5">
          <p className="label-caps mb-4">{isAr ? "الطلب حسب المدينة" : "Demand by city"}</p>
          {cities.length ? (
            <ul className="m-0 space-y-2 p-0">
              {cities.slice(0, 8).map((c) => (
                <li key={c.name} className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="tabular-nums text-[var(--muted)]">{c.count}</span>
                </li>
              ))}
            </ul>
          ) : cats.length ? (
            <ul className="m-0 space-y-2 p-0">
              {cats.slice(0, 8).map((c) => (
                <li key={c.name} className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="tabular-nums text-[var(--muted)]">{c.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-[var(--muted)]">
              {isAr ? "ستظهر رؤى المدن مع نمو الزيارات." : "City demand insights appear as traffic grows."}
            </p>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
