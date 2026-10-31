"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default function AdminReportsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [reports, setReports] = useState<unknown[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin?resource=message_reports")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setReports(Array.isArray(j.data) ? j.data : []);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "الإشراف على القوائم والبلاغات" : "Listing moderation & reports"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr ? "بلاغات الرسائل والقوائم للمراجعة." : "Message and listing reports for review."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}
      <p className="mb-4 text-sm">
        <a href={`/${locale}/admin/products`} className="text-[var(--accent)]">
          {isAr ? "إدارة المنتجات" : "Product moderation"}
        </a>
      </p>
      {reports.length === 0 ? (
        <div className="empty-state">{isAr ? "لا بلاغات مفتوحة." : "No open reports."}</div>
      ) : (
        <pre className="surface-card overflow-auto p-4 text-xs">{JSON.stringify(reports, null, 2)}</pre>
      )}
    </DashboardShell>
  );
}
