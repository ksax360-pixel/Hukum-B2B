import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { sourcingWhatsAppHref, sourcingWhatsAppIsExternal } from "@/lib/sourcing-contact";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/sourcing-help", "ignored", undefined, { seoKey: "sourcing-help" });
}

export default async function SourcingHelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const waHref = sourcingWhatsAppHref(locale);
  const waExternal = sourcingWhatsAppIsExternal();
  const options = isAr
    ? [
        { title: "طلب عروض أسعار", body: "أدخل مواصفاتك وكمياتك وموعد التسليم في طلب منظم يصل إلى الموردين المناسبين.", href: `/${locale}/rfq`, cta: "ابدأ طلباً" },
        { title: "رفع جدول الكميات", body: "ارفع جدول الكميات أو قائمة الأصناف بدلاً من إدخال كل بند يدوياً.", href: `/${locale}/upload-boq`, cta: "ارفع جدول الكميات" },
      ]
    : [
        { title: "Request quotations", body: "Enter specifications, quantities and delivery needs in one structured request for relevant suppliers.", href: `/${locale}/rfq`, cta: "Start an RFQ" },
        { title: "Upload a BOQ", body: "Upload a bill of quantities or item list instead of entering every line manually.", href: `/${locale}/upload-boq`, cta: "Upload your BOQ" },
      ];
  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "مساعدة التوريد" : "Sourcing support"}
          title={isAr ? "اختر طريقة إرسال احتياجك" : "Choose how to send your requirement"}
          arabic={isAr ? undefined : "مساعدة التوريد"}
          lead={isAr ? "من طلب بسيط إلى جدول كميات معقد، استخدم المسار الأنسب لعملية الشراء وفريقك." : "From a simple request to a complex BOQ, use the route that best fits your purchase and team."}
          crumbs={[{ label: isAr ? "الرئيسية" : "Home", href: `/${locale}` }, { label: isAr ? "مساعدة التوريد" : "Sourcing help" }]}
        />

        <section className="grid gap-5 md:grid-cols-3">
          {options.map((option) => (
            <article key={option.href} className="hukum-card flex flex-col p-6">
              <span className="hukum-badge-pill w-fit">{isAr ? "عبر المنصة" : "On platform"}</span>
              <h2 className="mt-4 text-lg font-bold">{option.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-7 text-[var(--hukum-muted)]">{option.body}</p>
              <Link href={option.href} className="hukum-btn hukum-btn--secondary mt-5 w-fit">{option.cta} <span aria-hidden>→</span></Link>
            </article>
          ))}
          <article className="hukum-card flex flex-col p-6">
            <span className="hukum-badge-pill w-fit">{isAr ? "محادثة مباشرة" : "Direct message"}</span>
            <h2 className="mt-4 text-lg font-bold">{isAr ? "التوريد عبر واتساب" : "WhatsApp sourcing"}</h2>
            <p className="mt-2 flex-1 text-sm leading-7 text-[var(--hukum-muted)]">{isAr ? "أرسل وصفاً أو صورة أو ملفاً، وسيساعدك فريق التوريد على تحديد الخطوة التالية." : "Send a description, image or file and let the sourcing team help identify the next step."}</p>
            {waExternal ? (
              <a href={waHref} target="_blank" rel="noreferrer" className="hukum-btn hukum-btn--secondary mt-5 w-fit">{isAr ? "راسلنا عبر واتساب" : "Message on WhatsApp"} <span aria-hidden>↗</span></a>
            ) : (
              <Link href={waHref} className="hukum-btn hukum-btn--secondary mt-5 w-fit">{isAr ? "تواصل معنا" : "Contact us"} <span aria-hidden>→</span></Link>
            )}
          </article>
        </section>

        <section className="hukum-premium-panel mt-10 p-7 sm:p-10">
          <div className="relative z-10 max-w-2xl">
            <span className="hukum-badge-pill hukum-badge-pill--gold">{isAr ? "خدمة مميزة" : "Premium service"}</span>
            <h2 className="mt-5 text-2xl font-bold sm:text-3xl">{isAr ? "كونسيرج التوريد VIP" : "VIP Sourcing Concierge"}</h2>
            <p className="mt-4 text-sm leading-7 text-white/75 sm:text-base">
              {isAr ? "للمشتريات العاجلة أو متعددة البنود، يساعد فريقنا في تنظيم الاحتياج، والتواصل مع الموردين، وتوحيد العروض، وإعداد مقارنة عملية لفريقك. يبقى قرار المورد والتعاقد لدى منشأتك." : "For urgent or multi-line purchases, our team can structure the requirement, coordinate supplier outreach, normalize quotations and prepare a practical comparison for your team. Supplier selection and contracting remain with your business."}
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-white/85 sm:grid-cols-2">
              {(isAr ? ["مراجعة نطاق الطلب", "تنسيق التواصل مع الموردين", "توحيد عناصر المقارنة", "ملخص واضح لصنّاع القرار"] : ["Requirement scope review", "Coordinated supplier outreach", "Normalized comparison points", "Clear decision-maker summary"]).map((item) => <li key={item} className="flex gap-2"><span className="text-[var(--hukum-badge)]" aria-hidden>◆</span>{item}</li>)}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/${locale}/contact`} className="hukum-btn hukum-btn--gold">{isAr ? "اطلب خدمة الكونسيرج" : "Enquire about concierge"}</Link>
              <Link href={`/${locale}/how-it-works#compare`} className="hukum-btn border border-white/25 text-white hover:border-white/60">{isAr ? "دليل مقارنة العروض" : "Quotation comparison guide"}</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
