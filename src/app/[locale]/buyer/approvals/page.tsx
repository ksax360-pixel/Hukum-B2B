"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";

const LIMITS_KEY = "kt_buyer_spend_limits";

export default function BuyerApprovalsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [limit, setLimit] = useState(50000);
  const [requireApprovalAbove, setRequireApprovalAbove] = useState(10000);
  const [pending, setPending] = useState<
    Array<{ id: string; vendor: string; total: number; currency: string; status: string }>
  >([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIMITS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.limit) setLimit(p.limit);
        if (p.requireApprovalAbove) setRequireApprovalAbove(p.requireApprovalAbove);
      }
    } catch {
      /* ignore */
    }
    fetch("/api/quotations")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return;
        const items = Array.isArray(j.data) ? j.data : [];
        setPending(
          items
            .filter((q: { status?: string }) => ["submitted", "shortlisted", "revised"].includes(q.status || ""))
            .map((q: {
              _id: string;
              total?: number;
              currency?: string;
              status?: string;
              vendorId?: { legalName?: { en?: string; ar?: string }; tradeName?: string };
            }) => ({
              id: q._id,
              vendor:
                (locale === "ar" ? q.vendorId?.legalName?.ar : q.vendorId?.legalName?.en) ||
                q.vendorId?.tradeName ||
                "Vendor",
              total: Number(q.total) || 0,
              currency: q.currency || "SAR",
              status: q.status || "",
            }))
        );
      })
      .catch(() => undefined);
  }, [locale]);

  function saveLimits(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(LIMITS_KEY, JSON.stringify({ limit, requireApprovalAbove }));
    setMsg(isAr ? "تم حفظ حدود الإنفاق." : "Spend limits saved.");
  }

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "سير الموافقات وحدود الإنفاق" : "Approval workflows & spend limits"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "حدد حد الإنفاق والعروض التي تحتاج موافقة قبل القبول."
            : "Set spend caps and which quotes need approval before accept."}
        </p>
      </div>
      {msg ? <p className="mb-3 text-sm text-[var(--gold,#c9a962)]">{msg}</p> : null}

      <form onSubmit={saveLimits} className="mb-6 max-w-md space-y-3 surface-card p-5">
        <label className="block text-sm">
          {isAr ? "حد الإنفاق الشهري (ر.س)" : "Monthly spend limit (SAR)"}
          <input
            className="input-field mt-1"
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm">
          {isAr ? "الموافقة مطلوبة فوق (ر.س)" : "Require approval above (SAR)"}
          <input
            className="input-field mt-1"
            type="number"
            value={requireApprovalAbove}
            onChange={(e) => setRequireApprovalAbove(Number(e.target.value))}
          />
        </label>
        <button type="submit" className="btn-primary">
          {isAr ? "حفظ" : "Save"}
        </button>
      </form>

      <h2 className="mb-3 text-lg font-semibold">{isAr ? "بانتظار القرار" : "Awaiting decision"}</h2>
      <div className="space-y-2">
        {pending.map((p) => (
          <div key={p.id} className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="m-0 font-medium">{p.vendor}</p>
              <p className="m-0 text-xs text-[var(--muted)]">
                {p.currency} {p.total.toLocaleString()} · {p.status}
                {p.total >= requireApprovalAbove
                  ? isAr
                    ? " · يحتاج موافقة"
                    : " · needs approval"
                  : ""}
              </p>
            </div>
            <Link href={`/${locale}/buyer/quotations?id=${p.id}`} className="btn-secondary text-sm">
              {isAr ? "مراجعة" : "Review"}
            </Link>
          </div>
        ))}
        {!pending.length ? (
          <p className="text-sm text-[var(--muted)]">{isAr ? "لا عروض بانتظار الموافقة." : "No quotes awaiting approval."}</p>
        ) : null}
      </div>
    </DashboardShell>
  );
}
