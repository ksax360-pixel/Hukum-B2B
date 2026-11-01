export const dynamic = "force-dynamic";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/home/HeroSection";
import { BrowseBySector } from "@/components/home/BrowseBySector";
import { PopularInCategory } from "@/components/home/PopularInCategory";
import type { PopularProductItem } from "@/components/home/PopularProductCard";
import { HowHukumWorks } from "@/components/home/HowHukumWorks";
import { SupplierLevels } from "@/components/home/SupplierLevels";
import { WhatsAppSourcing } from "@/components/home/WhatsAppSourcing";
import { ConciergeSourcing } from "@/components/home/ConciergeSourcing";
import { SellOnHukum } from "@/components/home/SellOnHukum";
import { TrustedByBuyers } from "@/components/home/TrustedByBuyers";
import { HomeSnapSection } from "@/components/home/HomeSnapSection";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Product } from "@/modules/products/product.model";
import { Category } from "@/modules/categories/taxonomy.model";
import { fetchFeaturedProducts } from "@/modules/products/catalog-search";
import { t as loc } from "@/lib/utils";
import {
  formatPrice,
  mediaList,
  toPlain,
} from "@/components/products/product-helpers";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { organizationLd, websiteLd, webPageLd } from "@/modules/seo/jsonld";
import { LandingViewTracker } from "@/components/analytics/LandingViewTracker";
import type { ShowcaseCardItem } from "@/components/home/ShowcaseCards";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";

/** Fixed homepage sector order (10 cards). */
const HOME_SECTOR_KEYS = [
  "safety-equipment",
  "building-materials",
  "electrical",
  "fmcg",
  "oil-gas",
  "medical-equipment",
  "textiles",
  "lab-scientific",
  "stationery",
  "furniture-fitout",
] as const;

/** Homepage card titles (override catalog when we want a shorter label). */
const HOME_SECTOR_LABELS: Partial<Record<(typeof HOME_SECTOR_KEYS)[number], { en: string; ar: string }>> = {
  "oil-gas": { en: "Oil & Gas", ar: "النفط والغاز" },
  "furniture-fitout": { en: "Furniture", ar: "الأثاث" },
  electrical: { en: "Electrical & Electronics", ar: "الكهرباء والإلكترونيات" },
};

function mockPopularProducts(locale: Locale): PopularProductItem[] {
  const isAr = locale === "ar";
  const items = [
    {
      id: "mock-safety-helmet",
      slug: "industrial-safety-helmet",
      cover: "/categories/safety-equipment.jpg",
      brand: "Hukum Spec",
      sku: "HK-SH-100",
      titleEn: "Industrial Safety Helmet",
      titleAr: "خوذة سلامة صناعية",
      tags: isAr ? ["سلامة", "PPE"] : ["Safety", "PPE"],
      moq: "50 pcs",
      price: isAr ? "من 45 ر.س" : "From SAR 45",
      lead: isAr ? "5–7 أيام" : "5–7 days",
      vendor: isAr ? "مورد الرياض" : "Riyadh Supply Co.",
    },
    {
      id: "mock-building-steel",
      slug: "structural-steel-beam",
      cover: "/categories/building-materials.jpg",
      brand: "Najd Steel",
      sku: "NS-BEAM-200",
      titleEn: "Structural Steel Beam",
      titleAr: "عارضة فولاذ إنشائية",
      tags: isAr ? ["بناء", "فولاذ"] : ["Construction", "Steel"],
      moq: "10 tons",
      price: isAr ? "اطلب السعر" : "Request price",
      lead: isAr ? "10–14 يومًا" : "10–14 days",
      vendor: isAr ? "نجد ستيل" : "Najd Steel",
    },
    {
      id: "mock-cable",
      slug: "copper-power-cable",
      cover: "/categories/electrical.jpg",
      brand: "VoltArc",
      sku: "VA-CBL-16",
      titleEn: "Copper Power Cable 16mm",
      titleAr: "كابل طاقة نحاسي 16مم",
      tags: isAr ? ["كهرباء", "كابل"] : ["Electrical", "Cable"],
      moq: "500 m",
      price: isAr ? "من 12 ر.س/م" : "From SAR 12/m",
      lead: isAr ? "3–5 أيام" : "3–5 days",
      vendor: isAr ? "فولت آرك" : "VoltArc KSA",
    },
    {
      id: "mock-fmcg-dates",
      slug: "premium-medjool-dates",
      cover: "/categories/fmcg.jpg",
      brand: "Oasis Grove",
      sku: "OG-DATE-5K",
      titleEn: "Premium Medjool Dates 5kg",
      titleAr: "تمر مجهول فاخر 5 كجم",
      tags: isAr ? ["FMCG", "أغذية"] : ["FMCG", "Food"],
      moq: "20 cartons",
      price: isAr ? "من 95 ر.س" : "From SAR 95",
      lead: isAr ? "2–4 أيام" : "2–4 days",
      vendor: isAr ? "واحة النخيل" : "Oasis Grove",
    },
    {
      id: "mock-oil-valve",
      slug: "industrial-gate-valve",
      cover: "/categories/oil-gas.jpg",
      brand: "PetroFit",
      sku: "PF-GV-4IN",
      titleEn: "Industrial Gate Valve 4\"",
      titleAr: "صمام بوابة صناعي 4 بوصة",
      tags: isAr ? ["نفط", "صمام"] : ["Oil & Gas", "Valve"],
      moq: "8 units",
      price: isAr ? "اطلب السعر" : "Request price",
      lead: isAr ? "12–18 يومًا" : "12–18 days",
      vendor: isAr ? "بتروفيت" : "PetroFit",
    },
    {
      id: "mock-bp-monitor",
      slug: "digital-bp-monitor",
      cover: "/categories/medical-equipment.jpg",
      brand: "MediCare SA",
      sku: "MC-BP-200",
      titleEn: "Digital Blood Pressure Monitor",
      titleAr: "جهاز قياس ضغط الدم الرقمي",
      tags: isAr ? ["طبي", "تشخيص"] : ["Medical", "Diagnostics"],
      moq: "25 units",
      price: isAr ? "من 180 ر.س" : "From SAR 180",
      lead: isAr ? "4–6 أيام" : "4–6 days",
      vendor: isAr ? "ميدي كير" : "MediCare SA",
    },
    {
      id: "mock-textiles",
      slug: "industrial-linen-set",
      cover: "/categories/textiles.jpg",
      brand: "WeaveHouse",
      sku: "WH-LN-30",
      titleEn: "Industrial Linen Set",
      titleAr: "طقم منسوجات صناعية",
      tags: isAr ? ["منسوجات", "فندقة"] : ["Textiles", "Hospitality"],
      moq: "100 sets",
      price: isAr ? "من 65 ر.س" : "From SAR 65",
      lead: isAr ? "7–10 أيام" : "7–10 days",
      vendor: isAr ? "ويف هاوس" : "WeaveHouse",
    },
    {
      id: "mock-lab-scope",
      slug: "compound-lab-microscope",
      cover: "/categories/lab-scientific.jpg",
      brand: "LabPrime",
      sku: "LP-MIC-40",
      titleEn: "Compound Lab Microscope",
      titleAr: "مجهر مختبري مركّب",
      tags: isAr ? ["مختبر", "علمي"] : ["Lab", "Scientific"],
      moq: "5 units",
      price: isAr ? "من 1,250 ر.س" : "From SAR 1,250",
      lead: isAr ? "8–12 يومًا" : "8–12 days",
      vendor: isAr ? "لاب برايم" : "LabPrime",
    },
  ];

  return items.map((item) => ({
    id: item.id,
    href: `/${locale}/products/${item.slug}`,
    cover: item.cover,
    brand: item.brand,
    sku: item.sku,
    title: isAr ? item.titleAr : item.titleEn,
    tags: item.tags,
    moqLabel: item.moq,
    priceLabel: item.price,
    leadTimeLabel: item.lead,
    verified: true,
    verifiedLabel: isAr ? "مورد موثّق" : "Verified supplier",
    vendorName: item.vendor,
    slug: item.slug,
    rfqHref: `/${locale}/rfq?productId=${encodeURIComponent(item.id)}`,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/", "home", undefined, { seoKey: "home" });
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
  let focusCategory: HomeCat | null = null;

  try {
    await connectDB();
    const l1Query = {
      status: "active" as const,
      level: 1,
      $or: [{ parentId: null }, { parentId: { $exists: false } }],
    };
    const [featuredProducts, fallbackProducts, featuredRows, l1Rows] = await Promise.all([
      fetchFeaturedProducts(18),
      Product.find({ status: "published" })
        .populate("vendorId", "verificationStatus tradeName legalName")
        .sort({ featured: -1, createdAt: -1 })
        .limit(18)
        .lean(),
      Category.find({ ...l1Query, featured: true }).sort({ order: 1 }).limit(12).lean(),
      Category.find(l1Query).sort({ order: 1 }).lean(),
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

  const allCats = [...popularCategories, ...allL1];
  const findCatByKey = (key: string) =>
    allCats.find((c) => {
      const k = catKey(c).toLowerCase();
      const slug = String(c.slug?.en || "").toLowerCase();
      return k === key || slug === key || slug.startsWith(key);
    });

  const sectorItems = HOME_SECTOR_KEYS.map((key) => {
    const fromDb = findCatByKey(key);
    const fromCatalog = MARKETPLACE_CATEGORIES.find((c) => c.key === key);
    const label = HOME_SECTOR_LABELS[key];
    if (fromDb) {
      return {
        id: String(fromDb._id),
        href: catHref(fromDb),
        nameEn: label?.en || fromDb.name?.en || fromCatalog?.name.en || "Sector",
        nameAr: label?.ar || fromDb.name?.ar || fromCatalog?.name.ar || "قطاع",
        image: fromDb.image,
        catalogKey: key,
      };
    }
    return {
      id: key,
      href: `/${locale}/c/${fromCatalog?.slug.en || key}`,
      nameEn: label?.en || fromCatalog?.name.en || key,
      nameAr: label?.ar || fromCatalog?.name.ar || key,
      catalogKey: key,
    };
  });

  const focusNameEn =
    focusCategory?.name?.en || focusCategory?.name?.ar || "Featured products";
  const focusNameAr =
    focusCategory?.name?.ar || focusCategory?.name?.en || "منتجات مميزة";
  const focusHref = focusCategory
    ? catHref(focusCategory)
    : `/${locale}/products?featured=true&sort=featured`;

  const livePopularCards: PopularProductItem[] = popularProducts.map((p) => {
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

  const mockCards = mockPopularProducts(locale);
  const popularCardItems =
    livePopularCards.length >= 6
      ? livePopularCards.slice(0, 8)
      : [...livePopularCards, ...mockCards].slice(0, 8);

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

      <HomeSnapSection hero>
        <HeroSection
          locale={locale}
          showcaseItems={showcaseItems}
          emptyLabel={tr("empty.products")}
        />
      </HomeSnapSection>

      <HomeSnapSection>
        <BrowseBySector
          locale={locale}
          sectors={sectorItems}
          totalSectors={Math.max(allL1.length, sectorItems.length)}
        />
      </HomeSnapSection>

      <HomeSnapSection>
        <PopularInCategory
          locale={locale}
          categoryNameEn={focusNameEn}
          categoryNameAr={focusNameAr}
          viewAllHref={focusHref}
          products={toPlain(popularCardItems)}
          emptyLabel={tr("empty.products")}
        />
      </HomeSnapSection>

      <HomeSnapSection>
        <HowHukumWorks locale={locale} />
      </HomeSnapSection>

      <HomeSnapSection>
        <WhatsAppSourcing locale={locale} />
      </HomeSnapSection>

      <HomeSnapSection>
        <SupplierLevels locale={locale} />
      </HomeSnapSection>

      <HomeSnapSection>
        <ConciergeSourcing locale={locale} />
      </HomeSnapSection>

      <HomeSnapSection>
        <TrustedByBuyers locale={locale} />
      </HomeSnapSection>

      <HomeSnapSection>
        <SellOnHukum locale={locale} />
      </HomeSnapSection>
    </>
  );
}
