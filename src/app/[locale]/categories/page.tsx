export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Category } from "@/modules/categories/taxonomy.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import {
  ALL_MARKETPLACE_SECTORS,
  MARKETPLACE_SECTOR_GROUPS,
  POPULAR_SECTOR_SLUGS,
} from "@/data/marketplace-sectors";
import { resolveSectorImageSrc } from "@/lib/sector-images";
import {
  CategoriesCatalogue,
  type CatalogueGroup,
  type CatalogueSector,
} from "@/components/categories/CategoriesCatalogue";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd, itemListLd } from "@/modules/seo/jsonld";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/categories", "ignored", undefined, { seoKey: "categories" });
}

type LeanCat = {
  _id: unknown;
  catalogKey?: string;
  icon?: string;
  slug?: { en?: string; ar?: string };
  name?: { en?: string; ar?: string };
};

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);

  const counts = new Map<string, number>();

  try {
    await connectDB();
    const cats = (await Category.find({
      status: "active",
      level: 1,
      $or: [{ parentId: null }, { parentId: { $exists: false } }],
    })
      .select("_id catalogKey icon slug name")
      .lean()) as LeanCat[];

    const idByKey = new Map<string, string>();
    for (const cat of cats) {
      const keys = [cat.catalogKey, cat.icon, cat.slug?.en]
        .filter(Boolean)
        .map((k) => String(k).toLowerCase());
      for (const key of keys) idByKey.set(key, String(cat._id));
    }

    const vendorRows = await Vendor.aggregate<{ _id: unknown; count: number }>([
      {
        $match: {
          status: { $nin: ["suspended", "rejected", "expired"] },
          verificationStatus: { $in: ["verified", "pending"] },
          categories: { $exists: true, $ne: [] },
        },
      },
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
    ]);

    const countByCatId = new Map(vendorRows.map((r) => [String(r._id), r.count]));

    for (const sector of ALL_MARKETPLACE_SECTORS) {
      const candidates = [sector.slug, ...(sector.legacyKeys || [])].map((k) => k.toLowerCase());
      let total = 0;
      for (const key of candidates) {
        const id = idByKey.get(key);
        if (id) total = Math.max(total, countByCatId.get(id) || 0);
      }
      counts.set(sector.slug, total);
    }
  } catch {
    /* offline — hide counts */
  }

  const toCard = (slug: string): CatalogueSector | null => {
    const sector = ALL_MARKETPLACE_SECTORS.find((s) => s.slug === slug);
    if (!sector) return null;
    return {
      slug: sector.slug,
      nameEn: sector.nameEn,
      nameAr: sector.nameAr,
      href: `/${locale}/categories/${sector.slug}`,
      imageSrc: resolveSectorImageSrc(sector),
      supplierCount: counts.get(sector.slug) || 0,
    };
  };

  const popular = POPULAR_SECTOR_SLUGS.map((slug) => toCard(slug)).filter(
    (s): s is CatalogueSector => Boolean(s)
  );

  const groups: CatalogueGroup[] = MARKETPLACE_SECTOR_GROUPS.map((group) => ({
    id: group.id,
    nameEn: group.nameEn,
    nameAr: group.nameAr,
    sectors: group.sectors.map((sector) => ({
      slug: sector.slug,
      nameEn: sector.nameEn,
      nameAr: sector.nameAr,
      href: `/${locale}/categories/${sector.slug}`,
      imageSrc: resolveSectorImageSrc(sector),
      supplierCount: counts.get(sector.slug) || 0,
    })),
  }));

  const isAr = locale === "ar";
  const sectorItems = ALL_MARKETPLACE_SECTORS.map((sector) => ({
    name: isAr ? sector.nameAr : sector.nameEn,
    path: `/categories/${sector.slug}`,
  }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(locale, [
            { name: isAr ? "الرئيسية" : "Home", path: "/" },
            { name: isAr ? "التصنيفات" : "Categories" },
          ]),
          itemListLd({
            name: isAr ? "قطاعات سوق حكم" : "Hukum marketplace sectors",
            path: "/categories",
            locale,
            items: sectorItems,
          }),
        ]}
      />
      <CategoriesCatalogue locale={locale} popular={popular} groups={groups} />
    </>
  );
}
