import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";

export default async function MarketplaceRulesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  return (
    <div className="container-custom section max-w-3xl">
      <p className="label-caps mb-3">{isAr ? "قانوني" : "Legal"}</p>
      <h1 className="text-3xl md:text-4xl font-semibold text-[var(--ink)] mb-6">
        {isAr ? "قواعد السوق" : "Marketplace rules"}
      </h1>
      <div className="surface-card p-8 space-y-6 text-sm text-[var(--ink-soft)] leading-relaxed">
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
        <p className="text-xs text-[var(--muted)]">
          {isAr
            ? "En / Ar: يمكن نشر النسخة الكاملة عبر CMS بنوع page أو faq."
            : "En / Ar: publish the full rulebook via CMS as page or faq entries."}
        </p>
      </div>
    </div>
  );
}
