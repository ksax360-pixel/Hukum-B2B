import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { TERMS } from "@/data/legal";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/terms", "ignored", undefined, { seoKey: "terms" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  return <LegalDoc locale={locale} doc={TERMS} path="/terms" />;
}
