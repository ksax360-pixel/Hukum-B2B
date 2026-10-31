"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";

type SpendRow = {
  id: string;
  vendor: string;
  category: string;
  total: number;
  currency: string;
  status: string;
  at?: string;
};

export default function BuyerSpendPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [rows, setRows] = useState<SpendRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"supplier" | "category">("supplier");

  useEffect(() => {
    Promise.all([fetch("/api/quotations").then((r) => r.json()), fetch("/api/rfqs").then((r) => r.json())])
      .then(([quoteJ, rfqJ]) => {
        if (!quoteJ.success) throw new Error(quoteJ.message);
        const items = Array.isArray(quoteJ.data) ? quoteJ.data : [];
        const rfqs = Array.isArray(rfqJ.data) ? rfqJ.data : [];
        const rfqCat = new Map<string, string>();
        for (const r of rfqs) {
          const first = r.items?.[0]?.name;
          const label =
            typeof first === "object" ? first?.en || first?.ar || "General" : String(first || "General");
          rfqCat.set(String(r._id), label);
        }
        setRows(
          items
            .filter((q: { status?: string }) =>
              ["accepted", "deal_confirmed", "reviewed", "shortlisted", "submitted"].includes(q.status || "")
            )
            .map((q: {
              _id: string;
              total?: number;
              currency?: string;
              status?: string;
              createdAt?: string;
              rfqId?: string | { _id?: string };
              vendorId?: { legalName?: { en?: string; ar?: string }; tradeName?: string };
            }) => {
              const rid = typeof q.rfqId === "object" ? String(q.rfqId?._id || "") : String(q.rfqId || "");
              return {
                id: q._id,
                vendor:
                  (locale === "ar" ? q.vendorId?.legalName?.ar : q.vendorId?.legalName?.en) ||
                  q.vendorId?.tradeName ||
                  "Vendor",
                category: rfqCat.get(rid) || "General",
                total: Number(q.total) || 0,
                currency: q.currency || "SAR",
                status: q.status || "",
                at: q.createdAt,
              };
            })
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [locale]);

  const spent = rows
    .filter((r) => ["accepted", "deal_confirmed", "reviewed"].includes(r.status))
    .reduce((s, r) => s + r.total, 0);
  const pipeline = rows
    .filter((r) => ["submitted", "shortlisted"].includes(r.status))
    .reduce((s, r) => s + r.total, 0);

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    const source = rows.filter((r) => ["accepted", "deal_confirmed", "reviewed"].includes(r.status));
    for (const r of source) {
      const key = view === "supplier" ? r.vendor : r.category;
      map.set(key, (map.get(key) || 0) + r.total);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows, view]);

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "تحليل الإنفاق حسب الفئة والمورد" : "Spend by category & supplier"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "إنفاق العروض المقبولة والصفقات المؤكدة من عروض الأسعار."
            : "Spend from accepted quotes and confirmed deals on Hukum."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <p className="m-0 text-[0.7rem] uppercase text-[var(--muted)]">{isAr ? "منفق" : "Spent"}</p>
          <p className="mt-1 mb-0 text-2xl font-semibold">SAR {spent.toLocaleString()}</p>
        </div>
        <div className="surface-card p-4">
          <p className="m-0 text-[0.7rem] uppercase text-[var(--muted)]">{isAr ? "قيد الدراسة" : "In pipeline"}</p>
          <p className="mt-1 mb-0 text-2xl font-semibold">SAR {pipeline.toLocaleString()}</p>
        </div>
        <div className="surface-card p-4">
          <p className="m-0 text-[0.7rem] uppercase text-[var(--muted)]">{isAr ? "عروض" : "Quotes"}</p>
          <p className="mt-1 mb-0 text-2xl font-semibold">{rows.length}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={view === "supplier" ? "btn-primary text-sm" : "btn-secondary text-sm"}
          onClick={() => setView("supplier")}
        >
          {isAr ? "حسب المورد" : "By supplier"}
        </button>
        <button
          type="button"
          className={view === "category" ? "btn-primary text-sm" : "btn-secondary text-sm"}
          onClick={() => setView("category")}
        >
          {isAr ? "حسب الفئة" : "By category"}
        </button>
      </div>

      {loading ? (
        <div className="skeleton h-32" />
      ) : grouped.length === 0 ? (
        <div className="empty-state">
          {isAr ? "لا إنفاق بعد — اقبل عرضاً لبدء التتبع." : "No spend yet — accept a quote to start tracking."}
          <div className="mt-3">
            <Link href={`/${locale}/buyer/quotations`} className="btn-primary text-sm">
              {isAr ? "العروض" : "Quotations"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mb-8 space-y-2">
          {grouped.map(([label, amount]) => (
            <div key={label} className="surface-card flex items-center justify-between gap-3 p-4">
              <p className="m-0 font-medium">{label}</p>
              <p className="m-0 font-semibold">SAR {amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && rows.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-3">{isAr ? "المورد" : "Vendor"}</th>
                <th className="p-3">{isAr ? "الفئة" : "Category"}</th>
                <th className="p-3">{isAr ? "المبلغ" : "Amount"}</th>
                <th className="p-3">{isAr ? "الحالة" : "Status"}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="table-row">
                  <td className="p-3 font-medium">{r.vendor}</td>
                  <td className="p-3 text-xs text-[var(--muted)]">{r.category}</td>
                  <td className="p-3">
                    {r.currency} {r.total.toLocaleString()}
                  </td>
                  <td className="p-3 capitalize">{r.status.replace(/_/g, " ")}</td>
                  <td className="p-3 text-right">
                    <Link href={`/${locale}/buyer/quotations?id=${r.id}`} className="text-xs text-[var(--accent)]">
                      {isAr ? "فتح" : "Open"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </DashboardShell>
  );
}
