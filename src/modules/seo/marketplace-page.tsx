import { setRequestLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Product } from "@/modules/products/product.model";
import { Category } from "@/modules/categories/taxonomy.model";
import { MarketplaceEntity } from "@/modules/seo/entity.model";
import { SeoRedirect } from "@/modules/seo/seo.model";
import { findEntityBySlug, seedMarketplaceEntities } from "@/modules/seo/pipeline";
import { findCatalogBySlug } from "@/modules/seo/catalog-resolve";
import { pickAeo } from "@/modules/seo/aeo";
import { composeMetadata, generateFromEntity } from "@/modules/seo/engine";
import { breadcrumbLd, collectionPageLd, faqPageLd, organizationLd } from "@/modules/seo/jsonld";
import { t as loc, slugifyText } from "@/lib/utils";
import { CategoryMarketplaceClient } from "@/components/products/CategoryMarketplaceClient";
import { toPlain, type ProductLike, type VendorLike } from "@/components/products/product-helpers";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";

type ListingProduct = ProductLike & {
  vendorId?: VendorLike;
  manufacturerName?: string;
  categoryKey?: string;
  categoryId?: string | { _id?: string; catalogKey?: string; icon?: string; slug?: { en?: string }; parentId?: string };
  subcategoryKeys?: string[];
};

function withCategoryKeys(
  rows: ListingProduct[],
  parentKeyByChildId?: Map<string, string>
): ListingProduct[] {
  return rows.map((p) => {
    const cat = typeof p.categoryId === "object" && p.categoryId ? p.categoryId : null;
    const key = cat?.catalogKey || cat?.icon || cat?.slug?.en || p.categoryKey || "";
    const id = cat?._id ? String(cat._id) : p.categoryId ? String(p.categoryId as string) : "";
    const parentKey = id && parentKeyByChildId ? parentKeyByChildId.get(id) : undefined;
    const subcategoryKeys = Array.from(new Set([key, parentKey].filter(Boolean))) as string[];
    return {
      ...p,
      categoryKey: key,
      subcategoryKeys,
      categoryId: id || undefined,
    };
  });
}

async function loadPublishedProductsForEntity(entity: EntityDoc) {
  const vendorPopulate = {
    path: "vendorId",
    select: "legalName tradeName verificationStatus location logo slug companyType",
  } as const;
  const categoryPopulate = {
    path: "categoryId",
    select: "catalogKey icon slug name parentId",
  } as const;

  let rows = toPlain(
    await Product.find({
      marketplaceEntityIds: entity._id,
      status: "published",
    })
      .sort({ featured: -1, updatedAt: -1 })
      .limit(80)
      .populate(vendorPopulate)
      .populate(categoryPopulate)
      .lean()
      .catch(() => [])
  ) as ListingProduct[];

  if (rows.length) return withCategoryKeys(rows);

  const catalogKey = entity.catalogKey || entity.key || "";
  if (!catalogKey) return rows;

  const roots = await Category.find({
    $or: [{ catalogKey }, { icon: catalogKey }, { "slug.en": catalogKey }],
  })
    .select("_id")
    .lean();
  const rootIds = roots.map((r) => r._id);
  if (!rootIds.length) return rows;

  const tree = await Category.find({
    $or: [{ _id: { $in: rootIds } }, { parentId: { $in: rootIds } }, { path: { $in: rootIds } }],
  })
    .select("_id")
    .lean();
  const categoryIds = tree.map((c) => c._id);
  if (!categoryIds.length) return rows;

  rows = toPlain(
    await Product.find({
      categoryId: { $in: categoryIds },
      status: "published",
    })
      .sort({ featured: -1, updatedAt: -1 })
      .limit(80)
      .populate(vendorPopulate)
      .populate(categoryPopulate)
      .lean()
      .catch(() => [])
  ) as ListingProduct[];

  return withCategoryKeys(rows);
}

type EntityDoc = {
  _id?: unknown;
  key?: string;
  kind?: string;
  slug?: string;
  name?: { en?: string; ar?: string };
  intro?: { en?: string; ar?: string };
  lifecycle?: string;
  indexable?: boolean;
  seo?: {
    title?: { en?: string; ar?: string };
    description?: { en?: string; ar?: string };
    h1?: { en?: string; ar?: string };
    canonical?: string;
    indexable?: boolean;
  };
  aeo?: {
    summary?: { en?: string; ar?: string };
    faqs?: { q?: { en?: string; ar?: string }; a?: { en?: string; ar?: string } }[];
    facts?: { label?: { en?: string; ar?: string }; value?: { en?: string; ar?: string } }[];
    buyingConsiderations?: { en?: string; ar?: string };
  };
  geo?: {
    entityCard?: { en?: string; ar?: string };
    attribution?: { en?: string; ar?: string };
    claims?: { key?: string; statement?: { en?: string; ar?: string } }[];
  };
  productCount?: number;
  vendorCount?: number;
  manufacturerCount?: number;
  relatedKeys?: string[];
  catalogKey?: string;
  parentKey?: string;
};

async function loadEntity(slug: string, facet?: string, locale?: string): Promise<EntityDoc | null> {
  await connectDB();
  const fromPath = `/${locale || "en"}/c/${facet ? `${slug}/${facet}` : slug}`;
  const bounced = await SeoRedirect.findOne({ fromPath, status: "active" }).lean();
  if (bounced?.toPath) redirect(bounced.toPath);
  await seedMarketplaceEntities();
  const db = await findEntityBySlug(slug, facet);
  if (db) return toPlain(db) as EntityDoc;
  const hit = findCatalogBySlug(slug);
  if (!hit) return null;
  const target = facet === "suppliers" ? `${hit.category.key}:suppliers` : hit.child?.key || hit.category.key;
  const fallback = await MarketplaceEntity.findOne({ key: target }).lean();
  return fallback ? (toPlain(fallback) as EntityDoc) : null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string; facet?: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const { locale: raw, slug, facet } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const sp = await searchParams;
  const faceted = Object.keys(sp).some((k) => k !== "page");
  try {
    const entity = await loadEntity(slug, facet, locale);
    if (!entity) {
      return composeMetadata({
        locale,
        path: `/c/${slug}`,
        title: "Marketplace",
        description: "Hukum marketplace",
        indexable: false,
      });
    }
    const gen = generateFromEntity("category", locale, { name: loc(locale, entity.name) });
    const path = facet ? `/c/${slug}/${facet}` : `/c/${entity.slug || slug}`;
    return composeMetadata({
      locale,
      path,
      title: gen.title,
      description: loc(locale, entity.intro) || gen.description,
      seo: entity.seo,
      indexable: Boolean(entity.indexable) && entity.seo?.indexable !== false && !faceted,
    });
  } catch {
    return composeMetadata({
      locale,
      path: `/c/${slug}`,
      title: "Marketplace",
      description: "Hukum marketplace",
      indexable: false,
    });
  }
}

export default async function MarketplaceEntityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string; facet?: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale: raw, slug, facet } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const sp = await searchParams;

  let loaded: EntityDoc | null = null;
  try {
    loaded = await loadEntity(slug, facet, locale);
  } catch {
    loaded = null;
  }
  if (!loaded) notFound();
  const entity = loaded;
  const page = entity;

  const path = facet ? `/c/${slug}/${facet}` : `/c/${entity.slug || slug}`;
  const h1 = loc(locale, entity.seo?.h1) || loc(locale, entity.name);
  const intro = loc(locale, entity.intro);
  const faceted = Object.keys(sp).some((k) => k !== "page");

  const products = (await loadPublishedProductsForEntity(entity)).filter((p) => {
    const v = p.vendorId;
    return !v || (v.verificationStatus !== "rejected" && v.verificationStatus !== "suspended");
  });

  const vendorMap = new Map<string, VendorLike>();
  for (const p of products) {
    const v = p.vendorId;
    if (v?._id && !vendorMap.has(String(v._id))) vendorMap.set(String(v._id), v);
  }
  const vendors = [...vendorMap.values()];

  const parent = entity.parentKey
    ? await MarketplaceEntity.findOne({ key: entity.parentKey }).select("name slug").lean()
    : null;

  const faqs = (entity.aeo?.faqs || [])
    .map((f) => ({ q: pickAeo(locale, f.q), a: pickAeo(locale, f.a) }))
    .filter((f) => f.q && f.a);
  const summary = pickAeo(locale, entity.aeo?.summary) || intro;
  const jsonItems = products.slice(0, 20).map((p) => ({
    name: loc(locale, p.name) || "",
    path: `/products/${p.slug?.en || p._id}`,
  }));
  const catalogKey = slugifyText(entity.catalogKey || entity.key || slug);
  const catalogMeta = MARKETPLACE_CATEGORIES.find(
    (c) => c.key === catalogKey || c.slug.en === catalogKey || c.slug.en === slug
  );
  const titleEn = entity.name?.en || catalogMeta?.name.en || h1;
  const titleAr = entity.name?.ar || catalogMeta?.name.ar || h1;
  const description =
    intro ||
    summary ||
    catalogMeta?.description?.[isAr ? "ar" : "en"] ||
    (isAr
      ? "منتجات ومواد من موردين موثّقين في السعودية والعالم."
      : "Products and materials from verified Saudi and international suppliers.");

  const dbChildren = await Category.find({
    $or: [{ catalogKey }, { icon: catalogKey }, { "slug.en": catalogKey }],
  })
    .select("_id")
    .lean();
  const rootIds = dbChildren.map((c) => c._id);
  const childCats = rootIds.length
    ? await Category.find({ parentId: { $in: rootIds }, status: { $ne: "archived" } })
        .select("name slug catalogKey icon image")
        .sort({ order: 1 })
        .lean()
    : [];

  const catalogChildren = catalogMeta?.children || [];
  const catalogChildKeys = new Set(catalogChildren.map((c) => c.key));
  // Hero: uploaded category image first, else static /categories/{key}.jpg
  const rootCategory = await Category.findOne({
    $or: [{ catalogKey }, { icon: catalogKey }, { "slug.en": catalogKey }],
    parentId: null,
  })
    .select("image")
    .lean();
  const heroImage =
    (rootCategory as { image?: string } | null)?.image || `/categories/${catalogKey}.jpg`;

  // Prefer marketplace L2 children only (skip empty L3 enrichment nodes parked under root)
  const filteredChildCats =
    catalogChildKeys.size > 0
      ? childCats.filter((c) => catalogChildKeys.has(String(c.catalogKey || c.icon || "")))
      : childCats;

  // Subcategory chips reuse parent hero (avoids broken /categories/{sub}.jpg 404s)
  const subcategoriesRaw =
    filteredChildCats.length > 0
      ? filteredChildCats.map((c) => ({
          key: String(c.catalogKey || c.icon || c.slug?.en || c._id),
          slug: String(c.slug?.en || c.catalogKey || c._id),
          name: { en: c.name?.en || "", ar: c.name?.ar || "" },
          image: (c.image as string | undefined) || heroImage,
        }))
      : catalogChildren.map((c) => ({
          key: c.key,
          slug: c.slug.en,
          name: c.name,
          image: heroImage,
        }));

  const skipTokens = new Set(["safety", "protection", "equipment", "industrial"]);
  const stem = (token: string) => {
    const t = token.toLowerCase();
    if (t.endsWith("ies") && t.length > 4) return t.slice(0, -3) + "y";
    if (t.endsWith("ves") && t.length > 4) return t.slice(0, -3) + "f";
    if (t.endsWith("s") && !t.endsWith("ss") && t.length > 3) return t.slice(0, -1);
    return t;
  };
  const subcategories = subcategoriesRaw.map((sub) => {
    const count = products.filter((p) => {
      const keys = [(p as ListingProduct).categoryKey, ...((p as ListingProduct).subcategoryKeys || [])].filter(
        Boolean
      );
      if (keys.includes(sub.key)) return true;
      const blob = `${p.name?.en || ""} ${p.sku || ""} ${p.brand || ""}`.toLowerCase();
      const tokens = sub.key
        .split("-")
        .map((t) => t.toLowerCase())
        .filter((t) => t.length > 2 && !skipTokens.has(t));
      if (tokens.some((t) => blob.includes(t) || blob.includes(stem(t)))) return true;
      const nameBits = (sub.name.en || "")
        .toLowerCase()
        .split(/[\s&/]+/)
        .map((t) => t.replace(/[^a-z0-9-]/g, ""))
        .filter((t) => t.length > 3 && !skipTokens.has(t));
      return nameBits.some((t) => blob.includes(t) || blob.includes(stem(t)));
    }).length;
    return { ...sub, count };
  });

  const faqLd = faqPageLd(faqs);
  void faceted;
  void page;

  return (
    <div className="min-h-screen bg-[var(--hukum-surface)] text-[var(--hukum-ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd()) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            collectionPageLd({ name: h1, description: intro || description, path, locale, items: jsonItems })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbLd(locale, [
              { name: isAr ? "الرئيسية" : "Home", path: "/" },
              { name: isAr ? "التصنيفات" : "Categories", path: "/categories" },
              ...(parent ? [{ name: loc(locale, parent.name), path: `/c/${parent.slug}` }] : []),
              { name: h1, path },
            ])
          ),
        }}
      />
      {faqLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} /> : null}

      <CategoryMarketplaceClient
        locale={locale}
        titleEn={titleEn}
        titleAr={titleAr}
        description={description}
        heroImage={heroImage}
        categorySlug={entity.slug || slug}
        catalogKey={catalogKey}
        products={products}
        subcategories={subcategories}
        productCountLabel={`${Math.max(products.length, entity.productCount || 0).toLocaleString()}+`}
        vendorCountLabel={`${Math.max(vendors.length, entity.vendorCount || 0).toLocaleString()}+`}
        rfqHref={`/${locale}/rfq?entity=${entity.slug || slug}`}
        parentBreadcrumb={
          parent
            ? { name: loc(locale, parent.name), href: `/${locale}/c/${parent.slug}` }
            : { name: isAr ? "التصنيفات" : "Categories", href: `/${locale}/categories` }
        }
      />
    </div>
  );
}
