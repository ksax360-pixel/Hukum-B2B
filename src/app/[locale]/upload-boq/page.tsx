import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/upload-boq", "ignored", undefined, { seoKey: "upload-boq" });
}

export default async function UploadBoqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "مساعدة التوريد" : "Sourcing support"}
          title={isAr ? "رفع جدول الكميات" : "Upload a BOQ"}
          arabic={isAr ? undefined : "رفع جدول الكميات"}
          lead={
            isAr
              ? "حوّل ملف Excel أو جدول الكميات إلى طلب منظم يصل إلى الموردين المناسبين."
              : "Turn an Excel file or bill of quantities into a structured request for the right suppliers."
          }
          crumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "مساعدة التوريد" : "Sourcing help", href: `/${locale}/sourcing-help` },
            { label: isAr ? "رفع جدول الكميات" : "Upload BOQ" },
          ]}
          actions={
            <>
              <Link href={`/${locale}/buyer/boq`} className="hukum-btn hukum-btn--primary">
                {isAr ? "افتح أداة الرفع" : "Open upload tool"}
              </Link>
              <Link href={`/${locale}/rfq`} className="hukum-btn hukum-btn--secondary">
                {isAr ? "طلب يدوي" : "Manual RFQ"}
              </Link>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          {(isAr
            ? [
                ["1", "جهّز الملف", "استخدم Excel أو CSV بأعمدة واضحة للصنف والكمية والوحدة إن أمكن."],
                ["2", "ارفع وراجع", "راجع البنود المستخرجة وعدّل الأسماء والكميات قبل الإرسال."],
                ["3", "أرسل للمطابقة", "يتحول الجدول إلى طلب عرض سعر يمكن مطابقته مع الموردين."],
              ]
            : [
                ["1", "Prepare the file", "Use Excel or CSV with clear columns for item, quantity and unit where possible."],
                ["2", "Upload and review", "Check extracted lines and adjust names or quantities before sending."],
                ["3", "Submit for matching", "The list becomes an RFQ that can be matched to relevant suppliers."],
              ]
          ).map(([n, title, body]) => (
            <article key={n} className="hukum-card p-6">
              <span className="hukum-badge-pill">{n}</span>
              <h2 className="mt-4 text-base font-bold text-[var(--hukum-ink)]">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--hukum-muted)]">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
