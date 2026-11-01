import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/how-it-works", "ignored", undefined, { seoKey: "how-it-works" });
}

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const steps = isAr
    ? [
        ["01", "ابحث وحدد احتياجك", "تصفح المنتجات والموردين حسب الفئة أو المدينة، وحدد المواصفات والكمية وموعد التسليم."],
        ["02", "أرسل طلب عرض سعر", "أنشئ طلباً واحداً واضحاً، وأرفق جدول الكميات أو الملفات المطلوبة ليصل إلى الموردين المناسبين."],
        ["03", "استلم عروضاً قابلة للمقارنة", "راجع السعر والضريبة والشحن ومدة التوريد وشروط الدفع، وليس السعر الإجمالي وحده."],
        ["04", "قارن وتحقق", "وازن بين القيمة والجاهزية، وراجع مستوى تحقق المورد ونطاق العرض والاستثناءات قبل الاختيار."],
        ["05", "تواصل واتفق", "تواصل مع المورد المختار لتأكيد التفاصيل التجارية والتسليم وإتمام الاتفاق مباشرة."],
      ]
    : [
        ["01", "Search and define the need", "Browse products and suppliers by category or city, then confirm specifications, quantity and required delivery date."],
        ["02", "Send one RFQ", "Create a clear request once and attach your BOQ or supporting files so relevant suppliers can respond."],
        ["03", "Receive comparable quotations", "Review price, VAT, freight, lead time and payment terms—not only the headline total."],
        ["04", "Compare and verify", "Balance value with readiness. Check the supplier’s verification level, scope, exclusions and quote validity."],
        ["05", "Connect and agree", "Contact the selected supplier to confirm commercial details, delivery and the final agreement directly."],
      ];
  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "دليل المشترين" : "Buyer guide"}
          title={isAr ? "كيف يعمل حكم للمشترين" : "How Hukum works for buyers"}
          arabic={isAr ? undefined : "كيف يعمل حكم للمشترين"}
          lead={isAr ? "من تحديد الاحتياج إلى اختيار المورد: مسار توريد منظم يساعد فريقك على اتخاذ قرار أوضح." : "From defining the need to selecting a supplier: a structured sourcing path that helps your team make a clearer decision."}
          crumbs={[{ label: isAr ? "الرئيسية" : "Home", href: `/${locale}` }, { label: isAr ? "كيف يعمل حكم" : "How it works" }]}
          actions={<Link href={`/${locale}/rfq`} className="hukum-btn hukum-btn--primary">{isAr ? "أنشئ طلب عرض" : "Create an RFQ"} <span aria-hidden>→</span></Link>}
        />

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label={isAr ? "خطوات الشراء" : "Buying steps"}>
          {steps.map(([number, title, body]) => (
            <article key={number} className="hukum-card p-5 sm:p-6">
              <span className="hukum-badge-pill">{number}</span>
              <h2 className="mt-4 text-lg font-bold text-[var(--hukum-ink)]">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--hukum-muted)]">{body}</p>
            </article>
          ))}
        </section>

        <section id="compare" className="mt-10 scroll-mt-24 rounded-[1.35rem] bg-[var(--hukum-surface)] p-6 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div>
              <span className="hukum-badge-pill hukum-badge-pill--gold">{isAr ? "مقارنة العروض" : "Quotation review"}</span>
              <h2 className="mt-4 text-2xl font-bold">{isAr ? "قارن على أساس التكلفة الكاملة" : "Compare the complete commercial offer"}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--hukum-muted)]">
                {isAr ? "وحّد العملة والكميات ونطاق التوريد أولاً. إذا اختلفت المواصفات أو شروط التسليم، فالإجماليات وحدها لا تعطي مقارنة عادلة." : "Normalize currency, quantities and supply scope first. If specifications or delivery terms differ, headline totals are not a fair comparison."}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {(isAr
                ? ["السعر شامل الضريبة والشحن", "مطابقة المواصفات والبدائل", "مدة التوريد وتوفر المخزون", "شروط الدفع وصلاحية العرض", "الضمان وخدمة ما بعد البيع", "مستوى تحقق المورد"]
                : ["Price including VAT and freight", "Specification match and alternatives", "Lead time and stock availability", "Payment terms and quote validity", "Warranty and after-sales support", "Supplier verification level"]
              ).map((item) => <li key={item} className="hukum-card flex gap-3 p-4 text-sm font-medium"><span className="text-[var(--hukum-green)]" aria-hidden>✓</span>{item}</li>)}
            </ul>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/${locale}/verification`} className="hukum-btn hukum-btn--secondary">{isAr ? "افهم مستويات التحقق" : "Understand verification"}</Link>
          <Link href={`/${locale}/rfq`} className="hukum-btn hukum-btn--primary">{isAr ? "اطلب عروض أسعار" : "Request quotations"}</Link>
          <Link href={`/${locale}/faq`} className="hukum-btn hukum-btn--ghost">{isAr ? "الأسئلة الشائعة" : "Read the FAQ"}</Link>
        </div>
      </div>
    </div>
  );
}
