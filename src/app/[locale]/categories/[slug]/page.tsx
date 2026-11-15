export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { composeMetadata } from "@/modules/seo/engine";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/modules/seo/jsonld";
import { loadBrowse, resolveBrowseNode, type BrowseFilters, type BrowseResult } from "@/modules/browse/browse.service";
import { BrowsePage } from "@/components/browse/BrowsePage";

type Params = Promise<{ locale: string; slug: string }>;
type Search = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const node = resolveBrowseNode(slug);
  if (!node) return { title: "Not found | Hukum", robots: { index: false, follow: false } };
  const isAr = locale === "ar";
  const title = isAr ? node.nameAr : node.nameEn;
  return composeMetadata({
    locale,
    path: `/categories/${node.slug}`,
    title: `${title} | Hukum`,
    description: isAr
      ? `منتجات وموردو ${node.nameAr} في السعودية — قارن العروض واطلب الأسعار على حكم.`
      : `${node.nameEn} products and suppliers in Saudi Arabia — compare offers and request quotes on Hukum.`,
    ogTitle: `${node.nameEn} suppliers in Saudi Arabia | موردو ${node.nameAr} في السعودية`,
    ogDescription: `Find verified ${node.nameEn} suppliers on Hukum. | اعثر على موردي ${node.nameAr} الموثّقين على حكم.`,
  });
}

export default async function CategoryBrowsePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { locale: raw, slug } = await params;
  const sp = await searchParams;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const node = resolveBrowseNode(slug);
  if (!node) notFound();

  const type =
    sp.type === "manufacturer" || sp.type === "distributor" || sp.type === "wholesaler" || sp.type === "service"
      ? sp.type
      : undefined;
  const filters: BrowseFilters = {
    q: sp.q?.trim().slice(0, 80) || undefined,
    city: sp.city?.slice(0, 40),
    verified: sp.verified === "1" || sp.verified === "true",
    saudi: sp.saudi === "1" || sp.saudi === "true",
    iso: sp.iso === "1" || sp.iso === "true",
    type,
    availability: sp.availability?.slice(0, 32) || undefined,
    featured: sp.featured === "1" || sp.featured === "true",
    sort: sp.sort === "newest" || sp.sort === "price" ? sp.sort : "relevant",
    page: Number(sp.page) || 1,
  };
  let result: BrowseResult = { products: [], total: 0, page: 1, pages: 0, suppliers: [], cities: [] };
  try {
    await connectDB();
    result = JSON.parse(JSON.stringify(await loadBrowse(node, filters))) as BrowseResult;
  } catch (e) {
    console.error("[categories/browse]", e);
  }

  const isAr = locale === "ar";
  return (
    <>
      <JsonLd
        data={breadcrumbLd(locale, [
          { name: isAr ? "الرئيسية" : "Home", path: "/" },
          { name: isAr ? "التصنيفات" : "Categories", path: "/categories" },
          ...node.trail.map((t) => ({ name: isAr ? t.nameAr : t.nameEn, path: `/categories/${t.slug}` })),
          { name: isAr ? node.nameAr : node.nameEn },
        ])}
      />
      <BrowsePage locale={locale} node={node} result={result} filters={filters} view={sp.view === "list" ? "list" : "grid"} />
    </>
  );
}
