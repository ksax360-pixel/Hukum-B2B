import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { SITE_CONTACT } from "@/data/site-contact";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/report", "ignored", undefined, { seoKey: "report" });
}

export default async function ReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap hukum-page__wrap--narrow">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "الثقة والسلامة" : "Trust and safety"}
          title={isAr ? "الإبلاغ عن مشكلة" : "Report a concern"}
          arabic={isAr ? undefined : "الإبلاغ عن مشكلة"}
          lead={isAr ? "أرسل تفاصيل واضحة عن مورد أو إعلان أو تواصل. يراجع فريق حكم البلاغات بسرية قدر الإمكان." : "Share clear details about a supplier, listing or communication. Hukum reviews reports as confidentially as reasonably possible."}
          crumbs={[{ label: isAr ? "الرئيسية" : "Home", href: `/${locale}` }, { label: isAr ? "الإبلاغ عن مشكلة" : "Report a concern" }]}
        />

        <form action={`mailto:${SITE_CONTACT.supportEmail}`} method="post" encType="text/plain" className="hukum-card space-y-5 p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="hukum-field">
              <span className="hukum-field__label">{isAr ? "الاسم" : "Your name"}</span>
              <input className="hukum-input" name="name" autoComplete="name" required />
            </label>
            <label className="hukum-field">
              <span className="hukum-field__label">{isAr ? "البريد الإلكتروني" : "Email address"}</span>
              <input className="hukum-input" type="email" name="email" autoComplete="email" required dir="ltr" />
            </label>
          </div>
          <label className="hukum-field">
            <span className="hukum-field__label">{isAr ? "نوع المشكلة" : "Concern type"}</span>
            <select className="hukum-select" name="type" defaultValue="" required>
              <option value="" disabled>{isAr ? "اختر نوع المشكلة" : "Select a concern"}</option>
              <option value="supplier">{isAr ? "مورد أو شركة" : "Supplier or company"}</option>
              <option value="listing">{isAr ? "منتج أو إعلان" : "Product or listing"}</option>
              <option value="communication">{isAr ? "رسالة أو تواصل" : "Message or communication"}</option>
              <option value="other">{isAr ? "أخرى" : "Other"}</option>
            </select>
          </label>
          <label className="hukum-field">
            <span className="hukum-field__label">{isAr ? "رابط أو رقم مرجعي (اختياري)" : "Page link or reference number (optional)"}</span>
            <input className="hukum-input" name="reference" placeholder={isAr ? "مثال: رابط المورد أو رقم الطلب" : "For example: supplier URL or RFQ number"} />
          </label>
          <label className="hukum-field">
            <span className="hukum-field__label">{isAr ? "ماذا حدث؟" : "What happened?"}</span>
            <textarea className="hukum-textarea" name="details" required placeholder={isAr ? "اذكر التواريخ والأسماء وما يدعم البلاغ، دون مشاركة كلمات المرور أو البيانات البنكية." : "Include dates, names and relevant facts. Never include passwords or banking credentials."} />
          </label>
          <p className="text-xs leading-6 text-[var(--hukum-muted)]">{isAr ? "يفتح زر الإرسال تطبيق البريد على جهازك. للحالات الطارئة أو الجرائم الجارية، تواصل مع الجهة المختصة مباشرة." : "Submitting opens your device’s email application. For emergencies or an active crime, contact the appropriate authority directly."}</p>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="hukum-btn hukum-btn--primary">{isAr ? "إرسال البلاغ" : "Send report"}</button>
            <Link href={`/${locale}/contact`} className="hukum-btn hukum-btn--secondary">{isAr ? "التواصل بطريقة أخرى" : "Use another contact method"}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}