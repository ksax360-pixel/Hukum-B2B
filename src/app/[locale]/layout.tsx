import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { direction, isLocale, locales, type Locale } from "@/i18n/config";
import { DocumentLocale } from "@/components/i18n/DocumentLocale";
import { AppChrome } from "@/components/layout/AppChrome";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = direction(locale);

  return (
    <div lang={locale === "ar" ? "ar" : "en"} dir={dir} className={locale === "ar" ? "arabic-font" : undefined}>
      <DocumentLocale locale={locale} dir={dir} />
      <NextIntlClientProvider messages={messages}>
        <AppChrome locale={locale}>{children}</AppChrome>
      </NextIntlClientProvider>
    </div>
  );
}
