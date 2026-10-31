"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";

type QuoteRow = {
  vendorKey: string;
  vendor: string;
  total: number;
  currency: string;
  status: string;
  at?: string;
};

export default function BuyerSuppliersPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/quotations")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        const items = Array.isArray(j.data) ? j.data : [];
        setRows(
          items.map((q: {
            total?: number;
            currency?: string;
            status?: string;
            createdAt?: string;
            vendorId?: { _id?: string; legalName?: { en?: string; ar?: string }; tradeName?: string };
          }) => {
            const name =
              (locale === "ar" ? q.vendorId?.legalName?.ar : q.vendorId?.legalName?.en) ||
              q.vendorId?.tradeName ||
              "Vendor";
            return {
              vendorKey: String(q.vendorId?._id || name),
              vendor: name,
              total: Number(q.total) || 0,
              currency: q.currency || "SAR",
              status: q.status || "",
              at: q.createdAt,
            };
          })
        );
      })
      .catch((e) => setError(e.message));
  }, [locale]);

  const byVendor = useMemo(() => {
    const map = new Map<
      string,
      { vendor: string; quotes: number; won: number; spend: number; lastAt?: string }
    >();
    for (const r of rows) {
      const cur = map.get(r.vendorKey) || {
        vendor: r.vendor,
        quotes: 0,
        won: 0,
        spend: 0,
        lastAt: undefined as string | undefined,
      };
      cur.quotes += 1;
      if (["accepted", "deal_confirmed", "reviewed"].includes(r.status)) {
        cur.won += 1;
        cur.spend += r.total;
      }
      if (!cur.lastAt || (r.at && r.at > cur.lastAt)) cur.lastAt = r.at;
      map.set(r.vendorKey, cur);
    }
    return [...map.values()].sort((a, b) => b.spend - a.spend || b.quotes - a.quotes);
  }, [rows]);

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "سجل أداء الموردين" : "Supplier performance history"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "عروض، صفقات، وإنفاق لكل مورد من عروض الأسعار على حكم."
            : "Quotes, wins, and spend per supplier from Hukum quotations."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}
      {byVendor.length === 0 ? (
        <div className="empty-state">
          {isAr ? "لا بيانات بعد." : "No supplier history yet."}
          <div className="mt-3">
            <Link href={`/${locale}/buyer/quotations`} className="btn-primary text-sm">
              {isAr ? "العروض" : "Quotations"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-3">{isAr ? "المورد" : "Supplier"}</th>
                <th className="p-3">{isAr ? "عروض" : "Quotes"}</th>
                <th className="p-3">{isAr ? "فوز" : "Wins"}</th>
                <th className="p-3">{isAr ? "إنفاق" : "Spend"}</th>
                <th className="p-3">{isAr ? "آخر نشاط" : "Last"}</th>
              </tr>
            </thead>
            <tbody>
              {byVendor.map((v) => (
                <tr key={v.vendor} className="table-row">
                  <td className="p-3 font-medium">{v.vendor}</td>
                  <td className="p-3">{v.quotes}</td>
                  <td className="p-3">{v.won}</td>
                  <td className="p-3">SAR {v.spend.toLocaleString()}</td>
                  <td className="p-3 text-xs text-[var(--muted)]">
                    {v.lastAt ? new Date(v.lastAt).toLocaleDateString(locale) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
