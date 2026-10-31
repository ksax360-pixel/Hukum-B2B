"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { dashT } from "@/i18n/dash-copy";
import { t } from "@/lib/utils";

type SavedProduct = { _id: string; productId?: { _id?: string; name?: { en?: string; ar?: string }; slug?: { en?: string } } };
type SavedVendor = { _id: string; vendorId?: { _id?: string; legalName?: { en?: string; ar?: string }; slug?: { en?: string } } };
type InterestRow = {
  productId: string;
  reference: string;
  productName?: string;
  vendorName?: string;
  quantity?: string;
};

export default function BuyerSavedPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [vendors, setVendors] = useState<SavedVendor[]>([]);
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kt_product_interests");
      const map = raw ? (JSON.parse(raw) as Record<string, string | InterestRow>) : {};
      setInterests(
        Object.entries(map).map(([productId, value]) =>
          typeof value === "string"
            ? { productId, reference: value }
            : { ...value, productId: value.productId || productId, reference: value.reference || "" }
        )
      );
    } catch {
      /* ignore */
    }

    fetch("/api/platform?resource=saved")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setProducts(j.data?.products || []);
        setVendors(j.data?.vendors || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const empty =
    !loading && products.length === 0 && vendors.length === 0 && interests.length === 0;

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Saved")}</h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "المنتجات والموردون والاهتمامات المسجّلة عبر القلب."
            : "Products, vendors, and interests you marked with the heart."}
        </p>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}

      {loading ? (
        <div className="surface-card p-8 skeleton h-32" />
      ) : empty ? (
        <div className="surface-card empty-state">
          <p className="label-caps mb-2">{isAr ? "المحفوظات" : "Bookmarks"}</p>
          <p className="text-[var(--ink)] font-medium">
            {isAr ? "لا يوجد شيء محفوظ بعد" : "Nothing saved yet"}
          </p>
          <p className="text-sm mt-2 mb-6">
            {isAr
              ? "اضغط قلب المنتج لتسجيل الاهتمام برقم الجوال وOTP."
              : "Tap a product heart to register interest with phone + OTP."}
          </p>
          <Link href={`/${locale}/products`} className="btn-secondary">
            {isAr ? "تصفح المنتجات" : "Browse products"}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {interests.length > 0 ? (
            <div className="surface-card p-6 lg:col-span-2">
              <p className="label-caps mb-4">
                {isAr ? "الاهتمامات" : "Interests"} ({interests.length})
              </p>
              <ul className="space-y-3 text-sm">
                {interests.map((row) => (
                  <li key={row.productId} className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/${locale}/products/${row.productId}`}
                        className="font-medium hover:text-[var(--accent)]"
                      >
                        {row.productName || (isAr ? "منتج مهتم به" : "Interested product")}
                      </Link>
                      <p className="m-0 text-xs text-[var(--muted)]">
                        {[row.vendorName, row.quantity ? `Qty ${row.quantity}` : "", row.reference]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#e8f6ee] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1f7a45]">
                      {isAr ? "اهتمام" : "Interested"}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/${locale}/buyer/profile`} className="btn-secondary text-sm">
                  {isAr ? "ملف المشتري" : "Buyer profile"}
                </Link>
                <Link href={`/${locale}/buyer/rfqs?tab=interests`} className="btn-secondary text-sm">
                  {isAr ? "تفاصيل الاهتمامات" : "Interest details"}
                </Link>
              </div>
            </div>
          ) : null}

          <div className="surface-card p-6">
            <p className="label-caps mb-4">
              {isAr ? "المنتجات" : "Products"} ({products.length})
            </p>
            <ul className="space-y-3 text-sm">
              {products.map((s) => (
                <li key={s._id}>
                  <Link
                    href={`/${locale}/products/${s.productId?.slug?.en || s.productId?._id}`}
                    className="font-medium hover:text-[var(--accent)]"
                  >
                    {t(locale, s.productId?.name) || "Product"}
                  </Link>
                </li>
              ))}
              {products.length === 0 ? (
                <li className="text-[var(--muted)]">{isAr ? "لا توجد منتجات محفوظة" : "No saved products"}</li>
              ) : null}
            </ul>
          </div>
          <div className="surface-card p-6">
            <p className="label-caps mb-4">
              {isAr ? "الموردون" : "Vendors"} ({vendors.length})
            </p>
            <ul className="space-y-3 text-sm">
              {vendors.map((s) => (
                <li key={s._id}>
                  <Link
                    href={`/${locale}/vendors/${s.vendorId?.slug?.en || s.vendorId?._id}`}
                    className="font-medium hover:text-[var(--accent)]"
                  >
                    {t(locale, s.vendorId?.legalName) || "Vendor"}
                  </Link>
                </li>
              ))}
              {vendors.length === 0 ? (
                <li className="text-[var(--muted)]">{isAr ? "لا يوجد موردون محفوظون" : "No saved vendors"}</li>
              ) : null}
            </ul>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
