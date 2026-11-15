"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";
import { mediaList } from "@/components/products/product-helpers";
import { t } from "@/lib/utils";

type ProductRow = {
  _id: string;
  sku?: string;
  brand?: string;
  name?: { en?: string; ar?: string };
  slug?: { en?: string };
  status?: string;
  price?: number;
  currency?: string;
  completenessScore?: number;
  media?: Array<{ url?: string; isPrimary?: boolean }>;
  vendorId?: { legalName?: { en?: string; ar?: string } };
};

async function fetchProducts(status: string) {
  const res = await fetch(`/api/products?status=${status}&limit=100`);
  const j = await res.json();
  if (!j.success) throw new Error(j.message);
  return (j.data?.items || []) as ProductRow[];
}

function ProductThumb({ product, locale }: { product: ProductRow; locale: string }) {
  const cover = mediaList(product)[0]?.url;
  const name = t(locale, product.name) || "Product";
  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover}
        alt=""
        className="h-12 w-14 rounded-md object-contain bg-[#f4f6f8] border border-[var(--border)] shrink-0"
      />
      <div className="min-w-0">
        <p className="font-medium truncate">{name}</p>
        <p className="text-xs text-[var(--muted)] truncate">
          {[product.brand, product.sku].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [catalog, setCatalog] = useState<ProductRow[]>([]);
  const [queue, setQueue] = useState<ProductRow[]>([]);
  const [rejected, setRejected] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchProducts("published"),
      fetchProducts("submitted"),
      fetchProducts("under_review"),
      fetchProducts("rejected"),
      fetchProducts("draft"),
    ])
      .then(([published, submitted, review, rej, drafts]) => {
        setCatalog(published);
        const merged = [...submitted, ...review, ...drafts];
        const seen = new Set<string>();
        setQueue(merged.filter((p) => (seen.has(p._id) ? false : (seen.add(p._id), true))));
        setRejected(rej);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: string, action?: string) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates: { status }, action }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setMessage(`Product ${status}`);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Products")}</h1>
        <p className="text-[var(--muted)]">Marketplace catalogue and moderation queues (draft, submitted, rejected).</p>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      {message && <p className="text-sm text-green-700 mb-4">{message}</p>}

      {queue.length > 0 ? (
        <div className="surface-card overflow-hidden mb-8">
          <div className="p-4 border-b border-[var(--border)]">
            <p className="label-caps">Moderation queue</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Product</th>
                <th className="p-4 label-caps">Vendor</th>
                <th className="p-4 label-caps">Status</th>
                <th className="p-4 label-caps" />
              </tr>
            </thead>
            <tbody>
              {queue.map((p) => (
                <tr key={p._id} className="table-row">
                  <td className="p-4">
                    <ProductThumb product={p} locale={locale} />
                  </td>
                  <td className="p-4 text-[var(--ink-soft)]">{t(locale, p.vendorId?.legalName) || "—"}</td>
                  <td className="p-4 capitalize">{p.status}</td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="btn-primary text-xs py-2 px-3"
                      disabled={busyId === p._id}
                      onClick={() => setStatus(p._id, "published", "approve")}
                    >
                      {busyId === p._id ? "…" : "Publish"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs py-2 px-3"
                      disabled={busyId === p._id}
                      onClick={() => setStatus(p._id, "rejected", "reject")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {rejected.length > 0 ? (
        <div className="surface-card overflow-hidden mb-8">
          <div className="p-4 border-b border-[var(--border)]">
            <p className="label-caps">Rejected ({rejected.length})</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Product</th>
                <th className="p-4 label-caps">Vendor</th>
                <th className="p-4 label-caps" />
              </tr>
            </thead>
            <tbody>
              {rejected.map((p) => (
                <tr key={p._id} className="table-row">
                  <td className="p-4">
                    <ProductThumb product={p} locale={locale} />
                  </td>
                  <td className="p-4 text-[var(--ink-soft)]">{t(locale, p.vendorId?.legalName) || "—"}</td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      className="btn-primary text-xs py-2 px-3"
                      disabled={busyId === p._id}
                      onClick={() => setStatus(p._id, "published", "approve")}
                    >
                      Re-publish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="surface-card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <p className="label-caps">Published catalogue</p>
          <span className="text-xs text-[var(--muted)]">{catalog.length} listings</span>
        </div>
        {loading ? (
          <div className="p-8 skeleton h-24 m-4" />
        ) : catalog.length === 0 ? (
          <div className="empty-state">
            <p className="label-caps mb-2">Catalogue</p>
            <p className="text-[var(--ink)] font-medium">No published products yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Product</th>
                <th className="p-4 label-caps">Vendor</th>
                <th className="p-4 label-caps">Price</th>
                <th className="p-4 label-caps">Completeness</th>
                <th className="p-4 label-caps" />
              </tr>
            </thead>
            <tbody>
              {catalog.map((p) => (
                <tr key={p._id} className="table-row">
                  <td className="p-4">
                    <ProductThumb product={p} locale={locale} />
                  </td>
                  <td className="p-4 text-[var(--ink-soft)]">{t(locale, p.vendorId?.legalName) || "—"}</td>
                  <td className="p-4">
                    {typeof p.price === "number" ? `${p.price} ${p.currency || "SAR"}` : "On request"}
                  </td>
                  <td className="p-4">{p.completenessScore ?? 0}%</td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    {p.slug?.en ? (
                      <Link href={`/${locale}/products/${p.slug.en}`} className="btn-ghost text-xs py-2 px-3 inline-block">
                        View
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="btn-ghost text-xs py-2 px-3"
                      disabled={busyId === p._id}
                      onClick={() => setStatus(p._id, "archived", "unpublish")}
                    >
                      Unpublish
                    </button>
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
