export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import type { SortOrder } from "mongoose";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Category, Industry } from "@/modules/categories/taxonomy.model";
import { VendorFilters, type Named } from "@/components/vendors/VendorFilters";
import { VendorCard } from "@/components/vendors/VendorCard";
import { t as loc } from "@/lib/utils";
import { toPlain, type VendorLike } from "@/components/products/product-helpers";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { stripVendorContacts } from "@/lib/public-vendor";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const isAr = raw === "ar";
  return staticPageMetadata(
    params,
    "/vendors",
    isAr ? "الموردون | Hukum" : "Verified Vendors | Hukum",
    isAr
      ? "اكتشف الموردين والمصانع والموزعين المعتمدين على Hukum."
      : "Discover verified manufacturers, distributors and suppliers on Hukum."
  );
}

export default async function VendorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const isAr = locale === "ar";

  let items: Array<Record<string, unknown>> = [];
  let categories: Named[] = [];
  let industries: Named[] = [];
  let total = 0;

  try {
    await connectDB();
    const query: Record<string, unknown> = {
      verificationStatus: { $in: ["verified", "pending"] },
      status: { $nin: ["suspended", "rejected", "expired"] },
    };

    if (sp.industryId) query.industries = sp.industryId;
    if (sp.categoryId) query.categories = sp.categoryId;
    if (sp.companyType) query.companyType = sp.companyType;
    if (sp.city) {
      const cityRx = { $regex: `^${String(sp.city).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
      query.$or = [{ "location.city": cityRx }, { citiesServed: cityRx }];
    }
    if (sp.verified === "true") query.verificationStatus = "verified";
    if (sp.featured === "true") query.featured = true;

    let sort: Record<string, SortOrder> = { featured: -1, createdAt: -1 };
    if (sp.sort === "name") sort = { "legalName.en": 1 };
    else if (sp.sort === "featured") sort = { featured: -1, createdAt: -1 };
    else if (sp.sort === "newest") sort = { createdAt: -1 };

    const page = Math.max(1, Number(sp.page || 1) || 1);
    const limit = 16;

    const loadMeta = () =>
      Promise.all([
        Category.find({ status: "active", level: 1 }).sort({ order: 1 }).lean(),
        Industry.find({ status: "active" }).sort({ order: 1 }).lean(),
      ]);

    if (sp.q) {
      try {
        const textQuery = { ...query, $text: { $search: sp.q } };
        const [rows, count] = await Promise.all([
          Vendor.find(textQuery)
            .sort({ score: { $meta: "textScore" } })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("industries", "name")
            .lean(),
          Vendor.countDocuments(textQuery),
        ]);
        items = toPlain(rows) as Array<Record<string, unknown>>;
        total = count;
      } catch {
        const regexQuery = {
          ...query,
          $or: [
            { tradeName: { $regex: sp.q, $options: "i" } },
            { "legalName.en": { $regex: sp.q, $options: "i" } },
            { "legalName.ar": { $regex: sp.q, $options: "i" } },
            { "location.city": { $regex: sp.q, $options: "i" } },
          ],
        };
        const [rows, count] = await Promise.all([
          Vendor.find(regexQuery)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("industries", "name")
            .lean(),
          Vendor.countDocuments(regexQuery),
        ]);
        items = toPlain(rows) as Array<Record<string, unknown>>;
        total = count;
      }
    } else {
      const [rows, count] = await Promise.all([
        Vendor.find(query)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("industries", "name")
          .lean(),
        Vendor.countDocuments(query),
      ]);
      items = toPlain(rows) as Array<Record<string, unknown>>;
      total = count;
    }

    const [cats, inds] = await loadMeta();
    categories = toPlain(cats) as unknown as Named[];
    industries = toPlain(inds) as unknown as Named[];
  } catch {
    /* offline */
  }

  const clearParam = (key: string) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (!v || k === key) continue;
      next.set(k, v);
    }
    const qs = next.toString();
    return `/${locale}/vendors${qs ? `?${qs}` : ""}`;
  };

  const activeChips: { label: string; href: string }[] = [];
  if (sp.q) activeChips.push({ label: `${isAr ? "بحث" : "Search"}: ${sp.q}`, href: clearParam("q") });
  if (sp.industryId) {
    const ind = industries.find((i) => String(i._id) === sp.industryId);
    activeChips.push({
      label: loc(locale, (ind?.name as { en?: string; ar?: string }) || { en: "Industry", ar: "قطاع" }),
      href: clearParam("industryId"),
    });
  }
  if (sp.categoryId) {
    const cat = categories.find((c) => String(c._id) === sp.categoryId);
    activeChips.push({
      label: loc(locale, (cat?.name as { en?: string; ar?: string }) || { en: "Category", ar: "تصنيف" }),
      href: clearParam("categoryId"),
    });
  }
  if (sp.city) activeChips.push({ label: sp.city, href: clearParam("city") });
  if (sp.verified === "true") {
    activeChips.push({ label: isAr ? "موثّق" : "Verified", href: clearParam("verified") });
  }
  if (sp.featured === "true") {
    activeChips.push({ label: isAr ? "مميز" : "Featured", href: clearParam("featured") });
  }

  return (
    <div className="products-shell">
      <div className="container-custom products-page">
        <div className="products-layout">
          <VendorFilters
            locale={locale}
            industries={industries}
            categories={categories}
            params={sp}
            resultCount={total}
          />

          <div className="products-main min-w-0">
            <header className="products-intro">
              <p className="label-caps">{isAr ? "الموردون" : "Suppliers"}</p>
              <h1 className="products-intro__title">{isAr ? "الموردون" : "Vendors"}</h1>
              <p className="products-intro__copy">
                {isAr
                  ? "اكتشف المصنّعين والموزّعين وتجار الجملة الموثّقين عبر المملكة."
                  : "Discover verified manufacturers, distributors, and wholesalers across Saudi Arabia."}
              </p>
            </header>

            <div className="products-toolbar">
              <p className="products-toolbar__count">
                <span className="font-semibold text-[#001730] tabular-nums">{total}</span>{" "}
                {isAr ? "مورد" : "vendors"}
              </p>
              {activeChips.length > 0 && (
                <div className="products-toolbar__chips">
                  {activeChips.map((chip) => (
                    <Link key={chip.href + chip.label} href={chip.href} className="products-chip">
                      {chip.label}
                      <span aria-hidden className="text-[#8a969b]">
                        ×
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="kt-vendor-grid">
              {items.length === 0 && (
                <div className="col-span-full empty-state">
                  {isAr ? "لا يوجد موردون مطابقون." : "No vendors match these filters."}
                </div>
              )}
              {items.map((v) => {
                const stripped = stripVendorContacts(v as Record<string, unknown>) || v;
                const vendor = stripped as VendorLike & {
                  companyType?: string;
                  featured?: boolean;
                  industries?: Array<{ name?: { en?: string; ar?: string } }>;
                };
                const industryLabel = vendor.industries?.[0]
                  ? loc(locale, vendor.industries[0].name)
                  : undefined;
                return (
                  <VendorCard
                    key={String(vendor._id)}
                    locale={locale}
                    vendor={vendor}
                    industryLabel={industryLabel}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
