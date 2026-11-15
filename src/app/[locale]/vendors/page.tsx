export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { loadDirectory, SUPPLIER_TYPES, type DirectoryFilters, type DirectoryResult } from "@/modules/vendors/directory.service";
import { VendorDirectory } from "@/components/vendors/VendorDirectory";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/vendors", "ignored", undefined, { seoKey: "vendors" });
}

/** Older links used companyType=… ; the menu uses type=… */
function typeFromParams(sp: Record<string, string | undefined>): string | undefined {
  const raw = sp.type || sp.companyType;
  if (!raw) return undefined;
  if (SUPPLIER_TYPES[raw]) return raw;
  return Object.entries(SUPPLIER_TYPES).find(([, t]) => t.values.includes(raw))?.[0];
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

  const filters: DirectoryFilters = {
    q: sp.q?.trim().slice(0, 120) || undefined,
    type: typeFromParams(sp),
    city: sp.city?.slice(0, 40) || undefined,
    verified: sp.verified === "1" || sp.verified === "true",
    saudi: sp.origin === "saudi" || sp.origin === "SA",
    page: Number(sp.page) || 1,
  };

  let result: DirectoryResult = { suppliers: [], total: 0, page: 1, pages: 0, typeCounts: {}, cities: [] };
  try {
    await connectDB();
    result = JSON.parse(JSON.stringify(await loadDirectory(filters))) as DirectoryResult;
  } catch (e) {
    console.error("[vendors/directory]", e);
  }

  return <VendorDirectory locale={locale} result={result} filters={filters} />;
}
