"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { t } from "@/lib/utils";

type ContactEvent = {
  _id: string;
  type?: string;
  createdAt?: string;
  meta?: Record<string, unknown>;
  vendorId?: { legalName?: { en?: string; ar?: string }; tradeName?: string };
  productId?: { name?: { en?: string; ar?: string }; sku?: string };
};

export default function AdminContactsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [items, setItems] = useState<ContactEvent[]>([]);
  const [byType, setByType] = useState<Array<{ _id: string; count: number }>>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin?resource=contacts&limit=100")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setItems(j.data?.items || []);
        setByType(j.data?.byType || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">Contact tracking</h1>
        <p className="text-[var(--muted)]">WhatsApp, phone, email, inquiry and quote events from product/vendor pages.</p>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {byType.length === 0 && !loading ? (
          <div className="dash-metric">
            <p className="label-caps mb-2">Events</p>
            <p className="text-2xl font-semibold">0</p>
          </div>
        ) : (
          byType.map((row) => (
            <div key={row._id} className="dash-metric">
              <p className="label-caps mb-2 truncate">{row._id}</p>
              <p className="text-2xl font-semibold">{row.count}</p>
            </div>
          ))
        )}
      </div>

      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 skeleton h-24 m-4" />
        ) : items.length === 0 ? (
          <div className="empty-state">No contact events recorded yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Type</th>
                <th className="p-4 label-caps">Vendor</th>
                <th className="p-4 label-caps">Product</th>
                <th className="p-4 label-caps">When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ev) => (
                <tr key={ev._id} className="table-row">
                  <td className="p-4 font-mono text-xs">{ev.type}</td>
                  <td className="p-4">{t(locale, ev.vendorId?.legalName) || ev.vendorId?.tradeName || "—"}</td>
                  <td className="p-4">{t(locale, ev.productId?.name) || ev.productId?.sku || "—"}</td>
                  <td className="p-4 text-[var(--muted)]">
                    {ev.createdAt ? new Date(ev.createdAt).toLocaleString(locale) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
