import { composeMetadata } from "@/modules/seo/engine";
import { bilingualOg, seoFor } from "@/modules/seo/page-seo";
import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";

export async function staticPageMetadata(
  params: Promise<{ locale: string }>,
  path: string,
  titleOrKey: string,
  description?: string,
  opts?: {
    indexable?: boolean;
    image?: string;
    /** When set, pull bilingual title/description + OG from PAGE_SEO. */
    seoKey?: string;
    ogTitle?: string;
    ogDescription?: string;
  }
) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const key = opts?.seoKey;
  const fromCatalog = key ? seoFor(key, locale) : null;
  const og = key ? bilingualOg(key) : null;

  return composeMetadata({
    locale,
    path,
    title: fromCatalog?.title || titleOrKey,
    description: fromCatalog?.description || description || titleOrKey,
    ogTitle: opts?.ogTitle || og?.title,
    ogDescription: opts?.ogDescription || og?.description,
    indexable: opts?.indexable,
    image: opts?.image,
  });
}
