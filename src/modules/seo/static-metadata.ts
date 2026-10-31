import { composeMetadata } from "@/modules/seo/engine";
import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";

export async function staticPageMetadata(
  params: Promise<{ locale: string }>,
  path: string,
  title: string,
  description: string,
  opts?: { indexable?: boolean; image?: string }
) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  return composeMetadata({
    locale,
    path,
    title,
    description,
    indexable: opts?.indexable,
    image: opts?.image,
  });
}
