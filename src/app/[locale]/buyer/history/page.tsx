"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { dashT } from "@/i18n/dash-copy";
import { readViewHistory, type HistoryItem } from "@/lib/view-history";

export default function BuyerHistoryPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [reminders, setReminders] = useState<
    Array<{ type?: string; title?: string; body?: string; href?: string }>
  >([]);

  useEffect(() => {
    setItems(readViewHistory());
    fetch("/api/quotations?resource=reminders&locale=" + locale)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data?.reminders)) setReminders(j.data.reminders);
      })
      .catch(() => undefined);
  }, [locale]);

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">{dashT(locale, "History") || (isAr ? "السجل" : "History")}</h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "المنتجات التي شاهدتها وتذكيرات إعادة الطلب والعروض."
            : "Recently viewed products plus reorder and quote reminders."}
        </p>
      </div>

      {reminders.length > 0 ? (
        <section className="mb-8 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            {isAr ? "تذكيرات" : "Reminders"}
          </h2>
          <ul className="m-0 space-y-2 p-0">
            {reminders.slice(0, 8).map((r, i) => (
              <li key={i} className="surface-card p-4">
                <p className="m-0 text-sm font-semibold text-[var(--ink)]">{r.title}</p>
                <p className="mt-1 mb-0 text-xs text-[var(--muted)]">{r.body}</p>
                {r.href ? (
                  <Link href={r.href.startsWith("/") ? r.href : `/${locale}${r.href}`} className="mt-2 inline-flex text-xs font-semibold text-[var(--accent)]">
                    {isAr ? "فتح" : "Open"}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          {isAr ? "شوهد مؤخراً" : "Recently viewed"}
        </h2>
        {items.length === 0 ? (
          <div className="empty-state">
            <p className="font-medium">{isAr ? "لا يوجد سجل بعد" : "No history yet"}</p>
            <Link href={`/${locale}/products`} className="btn-secondary mt-3 inline-flex">
              {isAr ? "تصفح المنتجات" : "Browse products"}
            </Link>
          </div>
        ) : (
          <ul className="m-0 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] p-0">
            {items.map((it) => (
              <li key={it.id + it.at} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link
                    href={`/${locale}/products/${it.slug}`}
                    className="font-medium text-[var(--ink)] hover:text-[var(--accent)]"
                  >
                    {it.name}
                  </Link>
                  <p className="mt-1 mb-0 text-xs text-[var(--muted)]">
                    {it.vendorName || "—"} · {new Date(it.at).toLocaleString(locale)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/${locale}/rfq?productId=${encodeURIComponent(it.id)}`}
                    className="btn-ghost px-3 py-2 text-xs"
                  >
                    {isAr ? "إعادة طلب" : "Re-RFQ"}
                  </Link>
                  <Link href={`/${locale}/products/${it.slug}`} className="btn-secondary px-3 py-2 text-xs">
                    {isAr ? "فتح" : "Open"}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}
