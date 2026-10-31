"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashT } from "@/i18n/dash-copy";
import { t } from "@/lib/utils";

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

type RfqRow = {
  _id: string;
  title?: { en?: string; ar?: string };
  status?: string;
  deadline?: string;
  currency?: string;
  createdAt?: string;
};

export default function VendorRfqsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [items, setItems] = useState<RfqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/rfqs?scope=vendor")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setItems(Array.isArray(j.data) ? j.data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell locale={locale} title="Vendor" nav={nav}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "RFQs")}</h1>
        <p className="text-[var(--muted)]">Requests for quotation you were invited to respond to.</p>
      </div>

      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}

      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 skeleton h-24 m-4" />
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="label-caps mb-2">Invitations</p>
            <p className="text-[var(--ink)] font-medium">No RFQ invitations</p>
            <p className="text-sm mt-2">Complete your profile and catalogue to improve matching when buyers publish RFQs.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Title</th>
                <th className="p-4 label-caps">Status</th>
                <th className="p-4 label-caps">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id} className="table-row">
                  <td className="p-4 font-medium">{t(locale, r.title) || "RFQ"}</td>
                  <td className="p-4 capitalize text-[var(--ink-soft)]">{r.status || "open"}</td>
                  <td className="p-4 text-[var(--muted)]">
                    {r.deadline ? new Date(r.deadline).toLocaleDateString(locale) : "—"}
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
