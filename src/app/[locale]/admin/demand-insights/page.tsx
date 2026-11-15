"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";

type Insights = {
  copy?: { title?: string; subtitle?: string; guard?: string };
  totals?: Record<string, number>;
  topSearches?: Array<{ query: string; count: number; zeroResultRate: number; label?: string }>;
  topCities?: Array<{ city: string; count: number; label?: string }>;
  categoryTrends?: Array<{ category: string; count: number; label?: string }>;
  weeklyTrend?: Array<{ week: string; searches: number; rfqs: number }>;
  priceIndex?: Array<{
    query: string;
    medianUnitSar?: number | null;
    sampleSize?: number;
    changePct?: number | null;
    alert?: string | null;
    label?: string;
  }>;
  priceAlerts?: Array<{ type: string; severity: string; message: string; query: string }>;
  note?: string;
  source?: string;
  windowDays?: number;
};

export default function AdminDemandInsightsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  useEffect(() => {
    setError("");
    fetch(`/api/ai/demand-insights?days=${days}&locale=${locale}&scope=platform`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setData(j.data);
      })
      .catch((e) => setError(e.message));
  }, [days, locale]);

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">
            {data?.copy?.title || dashT(locale, "Demand insights") || (isAr ? "رؤى الطلب" : "Demand insights")}
          </h1>
          <p className="text-[var(--muted)]">{data?.copy?.subtitle}</p>
          <p className="text-xs text-[var(--muted)]">{data?.copy?.guard}</p>
        </div>
        <select
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>{isAr ? "7 أيام" : "7 days"}</option>
          <option value={30}>{isAr ? "30 يوماً" : "30 days"}</option>
          <option value={90}>{isAr ? "90 يوماً" : "90 days"}</option>
        </select>
      </div>

      {error ? <p className="mb-4 text-sm text-[var(--accent)]">{error}</p> : null}
      {data?.note ? (
        <p className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2,#f7f7f5)] px-3 py-2 text-xs text-[var(--muted)]">
          {data.note} {data.source === "demo_anonymized" ? (isAr ? "· تجريبي" : "· demo") : ""}
        </p>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [isAr ? "عمليات البحث" : "Searches", data?.totals?.searches],
          [isAr ? "طلبات الأسعار" : "RFQs", data?.totals?.rfqs],
          [isAr ? "عروض الأسعار" : "Quotations", data?.totals?.quotations],
          [isAr ? "نتائج صفرية (AI)" : "AI zero-results", data?.totals?.aiZeroResults],
        ].map(([label, value]) => (
          <div key={String(label)} className="surface-card p-4">
            <p className="m-0 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">{label}</p>
            <p className="mt-1 mb-0 text-2xl font-semibold">{value ?? "—"}</p>
          </div>
        ))}
      </div>

      {data?.priceAlerts?.length ? (
        <div className="mb-6 space-y-2">
          <h2 className="text-lg font-semibold">{isAr ? "تنبيهات" : "Alerts"}</h2>
          {data.priceAlerts.map((a, i) => (
            <div
              key={i}
              className={`rounded-xl border px-4 py-3 text-sm ${
                a.severity === "warn"
                  ? "border-amber-300 bg-amber-50 text-amber-950"
                  : "border-[var(--border)] bg-white"
              }`}
            >
              {a.message}
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface-card overflow-hidden">
          <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
            {isAr ? "أكثر عمليات البحث" : "Top searches"}
          </h2>
          <ul className="m-0 list-none p-0">
            {(data?.topSearches || []).map((s) => (
              <li key={s.query} className="flex justify-between border-b border-[var(--border)] px-4 py-2.5 text-sm">
                <span>{s.label || s.query}</span>
                <span className="text-[var(--muted)]">
                  {s.count}
                  {s.zeroResultRate ? ` · ${s.zeroResultRate}% ∅` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card overflow-hidden">
          <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
            {isAr ? "المدن" : "Cities"}
          </h2>
          <ul className="m-0 list-none p-0">
            {(data?.topCities || []).map((c) => (
              <li key={c.city} className="flex justify-between border-b border-[var(--border)] px-4 py-2.5 text-sm">
                <span>{c.label || c.city}</span>
                <span className="text-[var(--muted)]">{c.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card overflow-hidden">
          <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
            {isAr ? "مؤشر الأسعار (وسيط)" : "Price index (median SAR)"}
          </h2>
          <ul className="m-0 list-none p-0">
            {(data?.priceIndex || []).map((p) => (
              <li key={p.query} className="border-b border-[var(--border)] px-4 py-2.5 text-sm">
                <div className="flex justify-between">
                  <span>{p.label || p.query}</span>
                  <span>
                    {p.medianUnitSar != null ? `${p.medianUnitSar} SAR` : "—"}
                    {p.changePct != null ? ` (${p.changePct > 0 ? "+" : ""}${p.changePct}%)` : ""}
                  </span>
                </div>
                {p.alert ? <p className="m-0 mt-1 text-xs text-[var(--muted)]">{p.alert}</p> : null}
              </li>
            ))}
            {!data?.priceIndex?.length ? (
              <li className="px-4 py-6 text-sm text-[var(--muted)]">
                {isAr ? "لا عينات سعر كافية بعد." : "Not enough quote samples yet."}
              </li>
            ) : null}
          </ul>
        </section>

        <section className="surface-card overflow-hidden">
          <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
            {isAr ? "الاتجاه الأسبوعي" : "Weekly trend"}
          </h2>
          <ul className="m-0 list-none p-0">
            {(data?.weeklyTrend || []).map((w) => (
              <li key={w.week} className="flex justify-between border-b border-[var(--border)] px-4 py-2.5 text-sm">
                <span>{w.week}</span>
                <span className="text-[var(--muted)]">
                  {isAr ? "بحث" : "search"} {w.searches} · RFQ {w.rfqs}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </DashboardShell>
  );
}
