import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/marketplace-rules", "ignored", undefined, {
    seoKey: "marketplace-rules",
  });
}

export default async function MarketplaceRulesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  return (
    <main className="hukum-page">
      <div className="hukum-page__wrap hukum-page__wrap--narrow">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "قانوني" : "Legal"}
          title={isAr ? "قواعد السوق" : "Marketplace rules"}
          goldEyebrow
        />
        <div className="hukum-card space-y-6 p-8 text-sm leading-relaxed text-[var(--hukum-muted)]">
        <p>
          {isAr
            ? "قواعد السلوك والامتثال للمشترين والموردين — محتوى قابل للتكوين من الإدارة."
            : "Conduct and compliance rules for buyers and vendors — configurable admin content."}
        </p>
        <ul className="list-disc ps-5 space-y-2">
          <li>{isAr ? "قوائم منتجات دقيقة وموثقة" : "Accurate, verifiable product listings"}</li>
          <li>{isAr ? "احترام سرية طلبات عروض الأسعار" : "Respect RFQ confidentiality"}</li>
          <li>{isAr ? "امتثال للوائح المحلية والضريبية" : "Compliance with local and tax regulations"}</li>
          <li>{isAr ? "حظر المحتوى المحظور أو المضلل" : "Prohibition of restricted or misleading content"}</li>
        </ul>
        <p className="text-xs text-[var(--hukum-muted)]">
          {isAr
            ? "En / Ar: يمكن نشر النسخة الكاملة عبر CMS بنوع page أو faq."
            : "En / Ar: publish the full rulebook via CMS as page or faq entries."}
        </p>
        </div>
      </div>
    </main>
  );
}
