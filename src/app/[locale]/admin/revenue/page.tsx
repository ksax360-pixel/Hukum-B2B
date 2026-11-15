"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";

type Plan = {
  key?: string;
  name?: { en?: string };
  price?: number;
  features?: { chargeSar?: number; leads?: number };
};

type Payment = {
  _id: string;
  amount?: number;
  currency?: string;
  status?: string;
  provider?: string;
  meta?: { plan?: string };
  createdAt?: string;
};

export default function AdminRevenuePage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [matrix, setMatrix] = useState<unknown[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin?resource=subscriptions").then((r) => r.json()),
      fetch("/api/monetisation?resource=plans").then((r) => r.json()),
    ])
      .then(([sub, mon]) => {
        if (!sub.success) throw new Error(sub.message);
        setPlans(sub.data?.plans || []);
        setPayments(sub.data?.payments || []);
        if (mon.success) setMatrix(mon.data?.plans || []);
      })
      .catch((e) => setError(e.message));
  }, []);

  const mrr = useMemo(() => {
    return payments
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  }, [payments]);

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "الإيرادات والاشتراكات" : "Monetisation & revenue"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "Free / Gold / Premium — الاشتراكات هي النموذج الأساسي؛ خدمات الشركاء إضافة (2029+)."
            : "Free / Gold / Premium — subscriptions are the committed model; partner services are 2029+ upside."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <p className="m-0 text-[0.7rem] uppercase text-[var(--muted)]">{isAr ? "مدفوعات مدفوعة" : "Paid volume"}</p>
          <p className="mt-1 mb-0 text-2xl font-semibold">SAR {mrr.toLocaleString()}</p>
        </div>
        <div className="surface-card p-4">
          <p className="m-0 text-[0.7rem] uppercase text-[var(--muted)]">{isAr ? "خطط نشطة" : "Active plans"}</p>
          <p className="mt-1 mb-0 text-2xl font-semibold">{plans.filter((p) => p.key).length || matrix.length}</p>
        </div>
        <div className="surface-card p-4">
          <p className="m-0 text-[0.7rem] uppercase text-[var(--muted)]">{isAr ? "مدفوعات" : "Payments"}</p>
          <p className="mt-1 mb-0 text-2xl font-semibold">{payments.length}</p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">{isAr ? "مصفوفة الخطط" : "Plan matrix"}</h2>
      <div className="mb-8 overflow-hidden surface-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="p-3">Plan</th>
              <th className="p-3">Charge</th>
              <th className="p-3">VAT</th>
            </tr>
          </thead>
          <tbody>
            {(matrix as Array<{ key: string; chargeSar: number; vatIncluded: boolean; priceSar: number }>).map(
              (p) => (
                <tr key={p.key} className="table-row">
                  <td className="p-3 capitalize font-medium">{p.key}</td>
                  <td className="p-3">SAR {p.chargeSar}</td>
                  <td className="p-3 text-xs text-[var(--muted)]">
                    {p.vatIncluded ? "incl." : `list ${p.priceSar} + 15%`}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-lg font-semibold">{isAr ? "دفتر المدفوعات" : "Payment ledger"}</h2>
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="p-3">Plan</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Status</th>
              <th className="p-3">When</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-[var(--muted)]">
                  {isAr ? "لا مدفوعات بعد." : "No payments yet."}
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p._id} className="table-row">
                  <td className="p-3 capitalize">{p.meta?.plan || "—"}</td>
                  <td className="p-3">
                    {p.currency || "SAR"} {p.amount}
                  </td>
                  <td className="p-3">{p.provider}</td>
                  <td className="p-3 capitalize">{p.status}</td>
                  <td className="p-3 text-xs text-[var(--muted)]">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString(locale) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
