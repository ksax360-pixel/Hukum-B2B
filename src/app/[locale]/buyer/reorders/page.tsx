"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";

type Reminder = { id: string; title: string; body: string; href?: string; type: string };

const RECUR_KEY = "kt_buyer_reorder_schedule";

export default function BuyerReordersPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [deals, setDeals] = useState<Array<{ id: string; vendor: string; total: number; currency: string }>>([]);
  const [error, setError] = useState("");
  const [cadenceDays, setCadenceDays] = useState(90);
  const [scheduleMsg, setScheduleMsg] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECUR_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.cadenceDays) setCadenceDays(Number(p.cadenceDays));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotations?resource=reminders&locale=${locale}`).then((r) => r.json()),
      fetch("/api/quotations").then((r) => r.json()),
    ])
      .then(([rem, quotes]) => {
        if (rem.success) setReminders(Array.isArray(rem.data?.reminders) ? rem.data.reminders : []);
        if (quotes.success) {
          const items = Array.isArray(quotes.data) ? quotes.data : [];
          setDeals(
            items
              .filter((q: { status?: string }) => ["accepted", "deal_confirmed", "reviewed"].includes(q.status || ""))
              .map((q: {
                _id: string;
                total?: number;
                currency?: string;
                vendorId?: { legalName?: { en?: string; ar?: string }; tradeName?: string };
              }) => ({
                id: q._id,
                vendor:
                  (locale === "ar" ? q.vendorId?.legalName?.ar : q.vendorId?.legalName?.en) ||
                  q.vendorId?.tradeName ||
                  "Vendor",
                total: Number(q.total) || 0,
                currency: q.currency || "SAR",
              }))
          );
        }
      })
      .catch((e) => setError(e.message));
  }, [locale]);

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">{isAr ? "إعادة الطلب والتذكيرات" : "Reorders & reminders"}</h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "أعد طلب صفقات سابقة وتابع تذكيرات دورة عرض السعر."
            : "Re-order past deals and follow quotation lifecycle reminders."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}

      <div className="mb-6 max-w-md space-y-2 surface-card p-4">
        <p className="m-0 text-sm font-semibold">
          {isAr ? "تذكير الطلبات المتكررة" : "Recurring order reminders"}
        </p>
        <label className="block text-xs text-[var(--muted)]">
          {isAr ? "كل كم يوماً؟" : "Remind every (days)"}
          <input
            className="input-field mt-1"
            type="number"
            min={7}
            value={cadenceDays}
            onChange={(e) => setCadenceDays(Number(e.target.value) || 90)}
          />
        </label>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => {
            localStorage.setItem(RECUR_KEY, JSON.stringify({ cadenceDays, savedAt: new Date().toISOString() }));
            setScheduleMsg(
              isAr
                ? `تم الحفظ — تذكير كل ${cadenceDays} يوماً.`
                : `Saved — remind every ${cadenceDays} days.`
            );
          }}
        >
          {isAr ? "حفظ الجدول" : "Save schedule"}
        </button>
        {scheduleMsg ? <p className="m-0 text-xs text-[var(--gold,#c9a962)]">{scheduleMsg}</p> : null}
      </div>

      <h2 className="mb-3 text-lg font-semibold">{isAr ? "صفقات لإعادة الطلب" : "Deals to reorder"}</h2>
      {deals.length === 0 ? (
        <p className="mb-6 text-sm text-[var(--muted)]">{isAr ? "لا صفقات مكتملة بعد." : "No completed deals yet."}</p>
      ) : (
        <div className="mb-8 grid gap-2">
          {deals.map((d) => (
            <div key={d.id} className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="m-0 font-medium">{d.vendor}</p>
                <p className="m-0 text-xs text-[var(--muted)]">
                  {d.currency} {d.total}
                </p>
              </div>
              <Link href={`/${locale}/buyer/rfqs`} className="btn-primary text-sm">
                {isAr ? "إعادة طلب سعر" : "Re-RFQ"}
              </Link>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">{isAr ? "التذكيرات" : "Reminders"}</h2>
      {reminders.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{isAr ? "لا تذكيرات حالياً." : "No reminders right now."}</p>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <a
              key={r.id}
              href={r.href || `/${locale}/buyer/messages`}
              className="surface-card block p-4 no-underline"
            >
              <p className="m-0 text-sm font-semibold text-[var(--ink)]">{r.title}</p>
              <p className="m-0 mt-1 text-xs text-[var(--muted)]">{r.body}</p>
            </a>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
