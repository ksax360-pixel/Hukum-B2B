import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/verification", "ignored", undefined, { seoKey: "verification" });
}

export default async function VerificationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const levels = isAr
    ? [
        { name: "مسجّل", badge: "المرحلة 1", summary: "أنشأ المورد حساباً وأكمل بياناته الأساسية.", checks: ["بيانات التواصل الأساسية", "ملف الشركة الأولي", "لا يعني اعتماد السجل التجاري"] },
        { name: "تم فحص السجل التجاري", badge: "المرحلة 2", summary: "تمت مراجعة بيانات السجل التجاري المقدمة وربطها بالمنشأة.", checks: ["مراجعة رقم السجل", "مطابقة اسم المنشأة", "مراجعة المعلومات المتاحة وقت الفحص"] },
        { name: "موثّق", badge: "المرحلة 3", summary: "اجتاز المورد نطاقاً أوسع من فحوصات الهوية والأعمال لدى حكم.", checks: ["فحوصات السجل والهوية", "مراجعة أدلة النشاط", "إعادة المراجعة عند الحاجة"] },
      ]
    : [
        { name: "Registered", badge: "Level 1", summary: "The supplier created an account and completed the basic company profile.", checks: ["Core contact details", "Initial company profile", "Does not mean the CR was approved"] },
        { name: "CR checked", badge: "Level 2", summary: "Submitted Commercial Registration details were reviewed and matched to the business.", checks: ["CR number review", "Business-name match", "Review of information available at the time"] },
        { name: "Verified", badge: "Level 3", summary: "The supplier passed a broader set of Hukum identity and business checks.", checks: ["CR and identity checks", "Evidence of business activity", "Re-review where appropriate"] },
      ];
  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "الثقة والشفافية" : "Trust and transparency"}
          title={isAr ? "مستويات التحقق" : "Supplier verification levels"}
          arabic={isAr ? undefined : "مستويات التحقق"}
          lead={isAr ? "توضح الشارات الفحوصات التي أكملها المورد لدى حكم، لتساعدك على إجراء العناية الواجبة بثقة أكبر." : "Badges show which Hukum checks a supplier has completed, helping you carry out due diligence with better context."}
          crumbs={[{ label: isAr ? "الرئيسية" : "Home", href: `/${locale}` }, { label: isAr ? "مستويات التحقق" : "Verification" }]}
          actions={<Link href={`/${locale}/vendors`} className="hukum-btn hukum-btn--primary">{isAr ? "تصفح الموردين" : "Browse vendors"}</Link>}
        />

        <section className="grid gap-5 lg:grid-cols-3">
          {levels.map((level, index) => (
            <article key={level.name} className={`hukum-card p-6 ${index === 2 ? "border-[rgba(196,165,116,.55)]" : ""}`}>
              <span className={index === 2 ? "hukum-badge-pill hukum-badge-pill--gold" : "hukum-badge-pill"}>{level.badge}</span>
              <h2 className="mt-4 text-xl font-bold">{level.name}</h2>
              <p className="mt-2 min-h-14 text-sm leading-6 text-[var(--hukum-muted)]">{level.summary}</p>
              <ul className="mt-5 space-y-3 border-t border-[var(--hukum-border)] pt-5">
                {level.checks.map((check) => <li key={check} className="flex gap-2 text-sm"><span className="text-[var(--hukum-green)]" aria-hidden>✓</span>{check}</li>)}
              </ul>
            </article>
          ))}
        </section>

        <aside className="mt-8 hukum-card hukum-card--soft p-5 sm:p-6">
          <h2 className="font-bold">{isAr ? "ما الذي لا تعنيه شارة التحقق؟" : "What a verification badge does not mean"}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-[var(--hukum-muted)]">
            {isAr ? "التحقق ليس ضماناً للأداء أو جودة المنتج أو نتيجة الصفقة. راجع العرض والعينات والمراجع والتراخيص ذات الصلة بعملية الشراء، ولا تحول أي دفعة قبل التحقق من بيانات المستفيد." : "Verification is not a guarantee of performance, product quality or transaction outcome. Review the quotation, samples, references and purchase-specific licences, and verify beneficiary details before transferring funds."}
          </p>
        </aside>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={`/${locale}/how-it-works`} className="hukum-btn hukum-btn--secondary">{isAr ? "كيف يعمل حكم" : "How Hukum works"}</Link>
          <Link href={`/${locale}/report`} className="hukum-btn hukum-btn--ghost">{isAr ? "الإبلاغ عن مشكلة" : "Report a concern"}</Link>
        </div>
      </div>
    </div>
  );
}
