export const dynamic = "force-dynamic";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/home/HeroSection";
import { BrowseBySector } from "@/components/home/BrowseBySector";
import { SuppliersNearYou, type NearSupplier } from "@/components/home/SuppliersNearYou";
import { PopularInCategory } from "@/components/home/PopularInCategory";
import type { PopularProductItem } from "@/components/home/PopularProductCard";
import { HowHukumWorks } from "@/components/home/HowHukumWorks";
import { SupplierLevels } from "@/components/home/SupplierLevels";
import { WhatsAppSourcing } from "@/components/home/WhatsAppSourcing";
import { ConciergeSourcing } from "@/components/home/ConciergeSourcing";
import { SellOnHukum } from "@/components/home/SellOnHukum";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Product } from "@/modules/products/product.model";
import { Category } from "@/modules/categories/taxonomy.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { fetchFeaturedProducts } from "@/modules/products/catalog-search";
import { t as loc } from "@/lib/utils";
import {
  formatPrice,
  mediaList,
  toPlain,
  vendorLogoUrl,
} from "@/components/products/product-helpers";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { organizationLd, websiteLd, webPageLd } from "@/modules/seo/jsonld";
import { LandingViewTracker } from "@/components/analytics/LandingViewTracker";
import type { ShowcaseCardItem } from "@/components/home/ShowcaseCards";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const isAr = raw === "ar";
  return staticPageMetadata(
    params,
    "/",
    isAr ? "Hukum | سوق B2B للمشترين والموردين" : "Hukum | Global B2B Marketplace for Buyers & Suppliers",
    isAr
      ? "اكتشف الموردين والمنتجات الصناعية عبر منصة Hukum للتجارة بين الشركات."
      : "Discover verified products, manufacturers and suppliers across industries through one intelligent B2B marketplace."
  );
}

function sectorIconFor(name: string): "medical" | "electrical" | "logistics" | "default" {
  const n = name.toLowerCase();
  if (/medic|health|pharma|lab|علمي|طبي|صح/.test(n)) return "medical";
  if (/electric|hvac|electr|كهرب/.test(n)) return "electrical";
  if (/logist|warehous|truck|نقل|لوجست/.test(n)) return "logistics";
  return "default";
}

type HomeCat = {
  _id: unknown;
  catalogKey?: string;
  icon?: string;
  image?: string;
  name?: { en?: string; ar?: string };
  slug?: { en?: string; ar?: string };
  featured?: boolean;
  order?: number;
};

type HomeVendor = {
  _id: unknown;
  tradeName?: string;
  legalName?: { en?: string; ar?: string };
  slug?: { en?: string };
  logo?: string;
  coverImage?: string;
  verificationStatus?: string;
  companyType?: string;
  certifications?: string[];
  capabilities?: string[];
  location?: { city?: string; region?: string; country?: string };
  citiesServed?: string[];
};

type RichProduct = {
  _id: unknown;
  name?: { en?: string; ar?: string };
  slug?: { en?: string };
  brand?: string;
  sku?: string;
  productCode?: string;
  priceType?: string;
  price?: number;
  currency?: string;
  unit?: string;
  moq?: number;
  leadTime?: string;
  featured?: boolean;
  tags?: string[];
  certifications?: string[];
  media?: Array<{ url?: string; isPrimary?: boolean }>;
  vendorId?: {
    _id?: unknown;
    verificationStatus?: string;
    tradeName?: string;
    legalName?: { en?: string; ar?: string };
  };
  categoryId?: unknown;
};

function pickPopularCategory(cats: HomeCat[]) {
  const scored = cats.map((c) => {
    const blob = `${c.name?.en || ""} ${c.name?.ar || ""} ${c.catalogKey || ""} ${c.slug?.en || ""}`.toLowerCase();
    let score = 0;
    if (/safety|سلامة|معدات السلامة/.test(blob)) score += 10;
    if (/ppe|helmet|خوذة/.test(blob)) score += 4;
    if (c.featured) score += 1;
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score ? scored[0].c : cats[0] || null;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const tr = await getTranslations();
  const isAr = locale === "ar";

  let products: RichProduct[] = [];
  let popularProducts: RichProduct[] = [];
  let popularCategories: HomeCat[] = [];
  let otherCategories: HomeCat[] = [];
  let allL1: HomeCat[] = [];
  let nearSuppliers: NearSupplier[] = [];
  let focusCategory: HomeCat | null = null;

  try {
    await connectDB();
    const l1Query = {
      status: "active" as const,
      level: 1,
      $or: [{ parentId: null }, { parentId: { $exists: false } }],
    };
    const [featuredProducts, fallbackProducts, featuredRows, l1Rows, vendorRows] = await Promise.all([
      fetchFeaturedProducts(18),
      Product.find({ status: "published" })
        .populate("vendorId", "verificationStatus tradeName legalName")
        .sort({ featured: -1, createdAt: -1 })
        .limit(18)
        .lean(),
      Category.find({ ...l1Query, featured: true }).sort({ order: 1 }).limit(12).lean(),
      Category.find(l1Query).sort({ order: 1 }).lean(),
      Vendor.find({
        $or: [
          { verificationStatus: "verified" },
          { status: "verified" },
          { verificationStatus: "pending" },
        ],
      })
        .sort({ verificationStatus: -1, updatedAt: -1 })
        .limit(48)
        .select(
          "tradeName slug legalName logo coverImage verificationStatus companyType certifications capabilities location citiesServed"
        )
        .lean(),
    ]);

    products = (featuredProducts.length ? featuredProducts : fallbackProducts) as RichProduct[];
    allL1 = l1Rows as HomeCat[];
    popularCategories = (featuredRows.length ? featuredRows : allL1.slice(0, 12)) as HomeCat[];
    const popularIds = new Set(popularCategories.map((c) => String(c._id)));
    otherCategories = allL1.filter((c) => !popularIds.has(String(c._id))).slice(0, 12);

    focusCategory = pickPopularCategory(allL1.length ? allL1 : popularCategories);
    if (focusCategory?._id) {
      const byCat = (await Product.find({
        status: "published",
        categoryId: focusCategory._id,
      })
        .populate("vendorId", "verificationStatus tradeName legalName")
        .sort({ featured: -1, createdAt: -1 })
        .limit(4)
        .lean()) as RichProduct[];
      popularProducts = byCat.length ? byCat : (products.slice(0, 4) as RichProduct[]);
    } else {
      popularProducts = products.slice(0, 4) as RichProduct[];
    }

    // If category had fewer than 4, pad from featured list without duplicates
    if (popularProducts.length < 4) {
      const seen = new Set(popularProducts.map((p) => String(p._id)));
      for (const p of products) {
        if (popularProducts.length >= 4) break;
        if (seen.has(String(p._id))) continue;
        popularProducts.push(p as RichProduct);
      }
    }

    const vendors = vendorRows as HomeVendor[];
    const vendorIds = vendors.map((v) => v._id);
    const countRows =
      vendorIds.length > 0
        ? ((await Product.aggregate([
            { $match: { status: "published", vendorId: { $in: vendorIds } } },
            { $group: { _id: "$vendorId", n: { $sum: 1 } } },
          ])) as Array<{ _id: unknown; n: number }>)
        : [];
    const countMap = new Map(countRows.map((r) => [String(r._id), r.n]));

    nearSuppliers = vendors.map((v) => {
      const name =
        v.tradeName ||
        (isAr ? v.legalName?.ar || v.legalName?.en : v.legalName?.en || v.legalName?.ar) ||
        "Supplier";
      const slug = v.slug?.en || String(v._id);
      const thumb =
        (v.coverImage && String(v.coverImage).trim()) ||
        vendorLogoUrl({
          logo: v.logo,
          tradeName: v.tradeName,
          legalName: v.legalName,
          slug: v.slug,
        }) ||
        "/vendors/demo.jpg";
      const tags = [
        ...(v.capabilities || []).slice(0, 2),
        ...(v.certifications || []).slice(0, 1),
      ]
        .map((t) => String(t).trim())
        .filter(Boolean);

      return {
        id: String(v._id),
        href: `/${locale}/vendors/${slug}`,
        name,
        city: v.location?.city || "",
        citiesServed: Array.isArray(v.citiesServed) ? v.citiesServed.map(String) : [],
        companyType: v.companyType,
        verificationStatus: v.verificationStatus,
        certifications: Array.isArray(v.certifications) ? v.certifications.map(String) : [],
        capabilities: Array.isArray(v.capabilities) ? v.capabilities.map(String) : [],
        productCount: countMap.get(String(v._id)) || 0,
        thumb,
        tags,
      };
    });
  } catch {
    /* offline */
  }

  const catHref = (item: HomeCat) => {
    const slug = item.slug?.en || item.catalogKey || item.icon || String(item._id);
    return `/${locale}/c/${slug}`;
  };
  const catKey = (item: HomeCat) => item.catalogKey || item.icon || item.slug?.en || "";

  const requestPriceLabel = isAr ? "اطلب السعر" : "Request price";
  const viewSectorLabel = isAr ? "عرض القطاع" : "View sector";

  const preferredSectors = ["medical", "electrical", "logistics", "طبي", "كهرب", "لوجست"];
  const sectorCats = [...popularCategories, ...otherCategories]
    .filter((c) => {
      const n = (isAr ? c.name?.ar || c.name?.en : c.name?.en || c.name?.ar) || "";
      return preferredSectors.some((k) => n.toLowerCase().includes(k));
    })
    .slice(0, 3);
  const sectorsToUse = sectorCats.length ? sectorCats : popularCategories.slice(0, 3);

  const showcaseItems: ShowcaseCardItem[] = [];
  products.forEach((p, i) => {
    showcaseItems.push({
      kind: "product",
      id: String(p._id),
      href: `/${locale}/products/${p.slug?.en || p._id}`,
      title: loc(locale, p.name) || p.brand || "Product",
      cover: mediaList(p)[0]?.url,
      label: requestPriceLabel,
    });
    if (i === 2) {
      showcaseItems.push({
        kind: "promo",
        id: "promo-quotes",
        href: `/${locale}/rfq`,
        title: isAr ? "طلب واحد.\nعدة موردين." : "One request.\nSeveral suppliers.",
        cta: isAr ? "اطلب عروض أسعار" : "Request quotes →",
      });
    }
    if (i === 5 && sectorsToUse[0]) {
      const c = sectorsToUse[0];
      const title = (isAr ? c.name?.ar || c.name?.en : c.name?.en || c.name?.ar) || "Category";
      showcaseItems.push({
        kind: "sector",
        id: `sector-${String(c._id)}`,
        href: catHref(c),
        title,
        subtitle: viewSectorLabel,
        icon: sectorIconFor(title),
      });
    }
    if (i === 8 && sectorsToUse[1]) {
      const c = sectorsToUse[1];
      const title = (isAr ? c.name?.ar || c.name?.en : c.name?.en || c.name?.ar) || "Category";
      showcaseItems.push({
        kind: "sector",
        id: `sector-${String(c._id)}`,
        href: catHref(c),
        title,
        subtitle: viewSectorLabel,
        icon: sectorIconFor(title),
      });
    }
    if (i === 11 && sectorsToUse[2]) {
      const c = sectorsToUse[2];
      const title = (isAr ? c.name?.ar || c.name?.en : c.name?.en || c.name?.ar) || "Category";
      showcaseItems.push({
        kind: "sector",
        id: `sector-${String(c._id)}`,
        href: catHref(c),
        title,
        subtitle: viewSectorLabel,
        icon: sectorIconFor(title),
      });
    }
  });

  if (!products.length && sectorsToUse.length) {
    sectorsToUse.forEach((c) => {
      const title = (isAr ? c.name?.ar || c.name?.en : c.name?.en || c.name?.ar) || "Category";
      showcaseItems.push({
        kind: "sector",
        id: `sector-${String(c._id)}`,
        href: catHref(c),
        title,
        subtitle: viewSectorLabel,
        icon: sectorIconFor(title),
      });
    });
    showcaseItems.push({
      kind: "promo",
      id: "promo-quotes",
      href: `/${locale}/rfq`,
      title: isAr ? "طلب واحد.\nعدة موردين." : "One request.\nSeveral suppliers.",
      cta: isAr ? "اطلب عروض أسعار" : "Request quotes →",
    });
  }

  const sectorPool = [
    ...popularCategories,
    ...allL1.filter((c) => !popularCategories.some((p) => String(p._id) === String(c._id))),
  ].slice(0, 10);

  const sectorItems = sectorPool.map((c) => ({
    id: String(c._id),
    href: catHref(c),
    nameEn: c.name?.en || c.name?.ar || "Sector",
    nameAr: c.name?.ar || c.name?.en || "قطاع",
    image: c.image,
    catalogKey: catKey(c),
  }));

  const plainSuppliers = toPlain(nearSuppliers);

  const focusNameEn =
    focusCategory?.name?.en || focusCategory?.name?.ar || "Featured products";
  const focusNameAr =
    focusCategory?.name?.ar || focusCategory?.name?.en || "منتجات مميزة";
  const focusHref = focusCategory
    ? catHref(focusCategory)
    : `/${locale}/products?featured=true&sort=featured`;

  const popularCardItems: PopularProductItem[] = popularProducts.map((p) => {
    const id = String(p._id);
    const slug = p.slug?.en || id;
    const vendor = p.vendorId;
    const vendorId = vendor?._id ? String(vendor._id) : "";
    const vendorName =
      vendor?.tradeName ||
      (isAr
        ? vendor?.legalName?.ar || vendor?.legalName?.en
        : vendor?.legalName?.en || vendor?.legalName?.ar) ||
      "";
    const verified = vendor?.verificationStatus === "verified";
    const price = formatPrice(p, locale);
    const tags = [
      ...(p.tags || []),
      ...(p.certifications || []),
    ]
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 3);

    const moqLabel =
      p.moq != null
        ? `${p.moq}${p.unit ? ` ${p.unit}` : ""}`
        : isAr
          ? "حسب الاتفاق"
          : "Negotiable";

    return {
      id,
      href: `/${locale}/products/${slug}`,
      cover: mediaList(p)[0]?.url,
      brand: p.brand || "",
      sku: p.sku || p.productCode || "",
      title: loc(locale, p.name) || p.brand || "Product",
      tags,
      moqLabel,
      priceLabel: price.public ? price.label : isAr ? "اطلب السعر" : "Request price",
      leadTimeLabel: p.leadTime || (isAr ? "حسب الاتفاق" : "On request"),
      verified,
      verifiedLabel: verified
        ? isAr
          ? "مورد موثّق"
          : "Verified supplier"
        : "",
      vendorName,
      slug,
      rfqHref: `/${locale}/rfq?productId=${encodeURIComponent(id)}${
        vendorId ? `&vendorId=${encodeURIComponent(vendorId)}` : ""
      }`,
    };
  });

  return (
    <>
      <LandingViewTracker />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd()) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageLd({
              name: "Hukum",
              description: isAr
                ? "سوق B2B للمشترين والموردين"
                : "Saudi AI-powered B2B marketplace and procurement infrastructure",
              path: "/",
              locale,
            })
          ),
        }}
      />

      <HeroSection
        locale={locale}
        showcaseItems={showcaseItems}
        emptyLabel={tr("empty.products")}
      />

      <BrowseBySector
        locale={locale}
        sectors={sectorItems}
        totalSectors={Math.max(allL1.length, sectorItems.length)}
      />

      <SuppliersNearYou locale={locale} suppliers={plainSuppliers} />

      <PopularInCategory
        locale={locale}
        categoryNameEn={focusNameEn}
        categoryNameAr={focusNameAr}
        viewAllHref={focusHref}
        products={toPlain(popularCardItems)}
        emptyLabel={tr("empty.products")}
      />

      <HowHukumWorks locale={locale} />

      <SupplierLevels locale={locale} />

      <WhatsAppSourcing locale={locale} />

      <ConciergeSourcing locale={locale} />

      <SellOnHukum locale={locale} />
    </>
  );
}
