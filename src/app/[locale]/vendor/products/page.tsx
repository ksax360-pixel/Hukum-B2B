"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashT } from "@/i18n/dash-copy";
import { mediaList } from "@/components/products/product-helpers";
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

type ProductRow = {
  _id: string;
  name?: { en?: string; ar?: string };
  status?: string;
  sku?: string;
  brand?: string;
  completenessScore?: number;
  createdAt?: string;
  media?: Array<{ url?: string; isPrimary?: boolean }>;
};

export default function VendorProductsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/products?mine=true")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setItems(j.data?.items || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: { en: nameEn.trim(), ar: nameAr.trim() },
          status: "draft",
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setNameEn("");
      setNameAr("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardShell locale={locale} title="Vendor" nav={nav}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Products")}</h1>
        <p className="text-[var(--muted)]">Your catalogue — create drafts and complete listing details.</p>
      </div>

      <form onSubmit={createProduct} className="surface-card p-6 mb-8 space-y-4">
        <p className="label-caps">New product</p>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            className="input-field"
            placeholder="Name (English)"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
          />
          <input
            className="input-field"
            placeholder="Name (Arabic)"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={creating}>
          {creating ? "Creating…" : "Create product"}
        </button>
      </form>

      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}

      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 skeleton h-24 m-4" />
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="label-caps mb-2">Catalogue</p>
            <p className="text-[var(--ink)] font-medium">No products yet</p>
            <p className="text-sm mt-2">Create a product above or use AI Upload to extract from a catalogue.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Product</th>
                <th className="p-4 label-caps">SKU</th>
                <th className="p-4 label-caps">Status</th>
                <th className="p-4 label-caps">Completeness</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const cover = mediaList(p)[0]?.url;
                return (
                <tr key={p._id} className="table-row">
                  <td className="p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt="" className="h-12 w-14 rounded-md object-contain bg-[#f4f6f8] border border-[var(--border)] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{t(locale, p.name) || "Untitled"}</p>
                        <p className="text-xs text-[var(--muted)] truncate">{p.brand || "Demo listing"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[var(--ink-soft)]">{p.sku || "—"}</td>
                  <td className="p-4 capitalize text-[var(--ink-soft)]">{p.status || "draft"}</td>
                  <td className="p-4">{p.completenessScore ?? 0}%</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
