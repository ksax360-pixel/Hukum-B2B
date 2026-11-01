import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";

export function PlaceholderPage({
  locale,
  titleEn,
  titleAr,
  blurbEn,
  blurbAr,
  eyebrowEn,
  eyebrowAr,
}: {
  locale: Locale;
  titleEn: string;
  titleAr: string;
  blurbEn?: string;
  blurbAr?: string;
  eyebrowEn?: string;
  eyebrowAr?: string;
}) {
  const isAr = locale === "ar";
  const title = isAr ? titleAr : titleEn;

  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap hukum-page__wrap--narrow">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? eyebrowAr || "قريباً" : eyebrowEn || "Coming soon"}
          title={title}
          lead={
            isAr
              ? blurbAr || "هذه الصفحة قيد الإعداد. يمكنك متابعة التصفح من الصفحة الرئيسية."
              : blurbEn || "This page is being prepared. You can keep browsing from the homepage."
          }
          crumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: title },
          ]}
          actions={
            <>
              <Link href={`/${locale}`} className="hukum-btn hukum-btn--primary">
                {isAr ? "العودة للرئيسية" : "Back to home"}
              </Link>
              <Link href={`/${locale}/contact`} className="hukum-btn hukum-btn--secondary">
                {isAr ? "تواصل معنا" : "Contact us"}
              </Link>
            </>
          }
        />
      </div>
    </div>
  );
}
