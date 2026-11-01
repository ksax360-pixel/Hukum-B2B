import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/vendors/cities", "ignored", undefined, { seoKey: "vendors-cities" });
}

export default async function VendorsByCityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const cities = [
    { value: "riyadh", en: "Riyadh", ar: "الرياض", regionEn: "Central", regionAr: "المنطقة الوسطى" },
    { value: "jeddah", en: "Jeddah", ar: "جدة", regionEn: "Western", regionAr: "المنطقة الغربية" },
    { value: "dammam", en: "Dammam", ar: "الدمام", regionEn: "Eastern", regionAr: "المنطقة الشرقية" },
    { value: "khobar", en: "Al Khobar", ar: "الخبر", regionEn: "Eastern", regionAr: "المنطقة الشرقية" },
    { value: "dhahran", en: "Dhahran", ar: "الظهران", regionEn: "Eastern", regionAr: "المنطقة الشرقية" },
    { value: "makkah", en: "Makkah", ar: "مكة المكرمة", regionEn: "Western", regionAr: "المنطقة الغربية" },
    { value: "madinah", en: "Madinah", ar: "المدينة المنورة", regionEn: "Western", regionAr: "المنطقة الغربية" },
    { value: "jubail", en: "Jubail", ar: "الجبيل", regionEn: "Eastern", regionAr: "المنطقة الشرقية" },
    { value: "qassim", en: "Qassim", ar: "القصيم", regionEn: "Central", regionAr: "المنطقة الوسطى" },
    { value: "tabuk", en: "Tabuk", ar: "تبوك", regionEn: "Northwestern", regionAr: "الشمال الغربي" },
    { value: "abha", en: "Abha", ar: "أبها", regionEn: "Southern", regionAr: "المنطقة الجنوبية" },
    { value: "yanbu", en: "Yanbu", ar: "ينبع", regionEn: "Western", regionAr: "المنطقة الغربية" },
  ];
  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "دليل الموردين" : "Supplier directory"}
          title={isAr ? "الموردون حسب المدينة" : "Vendors by city"}
          arabic={isAr ? undefined : "الموردون حسب المدينة"}
          lead={isAr ? "ابدأ من موقع التوريد أو التسليم، ثم صفِّ النتائج حسب الفئة ونوع المورد ومستوى التحقق." : "Start with your sourcing or delivery location, then refine results by category, vendor type and verification level."}
          crumbs={[{ label: isAr ? "الرئيسية" : "Home", href: `/${locale}` }, { label: isAr ? "الموردون" : "Vendors", href: `/${locale}/vendors` }, { label: isAr ? "حسب المدينة" : "By city" }]}
        />
        <section className="hukum-card p-5 sm:p-7">
          <div className="flex flex-wrap gap-3">
            {cities.map((city) => (
              <Link key={city.value} href={`/${locale}/vendors?city=${encodeURIComponent(city.value)}`} className="hukum-chip hukum-chip--active !min-h-10 !px-4 transition-transform hover:-translate-y-0.5">
                <span>{isAr ? city.ar : city.en}</span>
                <span className="font-normal opacity-65">· {isAr ? city.regionAr : city.regionEn}</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="mt-8 flex flex-col gap-5 rounded-[1.35rem] bg-[var(--hukum-surface)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-lg font-bold">{isAr ? "تحتاج موردين في أكثر من مدينة؟" : "Sourcing across multiple cities?"}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--hukum-muted)]">{isAr ? "أرسل طلب عرض واحداً وحدد مواقع التسليم ليتمكن الموردون من تسعير النطاق الصحيح." : "Send one RFQ and list your delivery locations so suppliers can quote the correct scope."}</p>
          </div>
          <Link href={`/${locale}/rfq`} className="hukum-btn hukum-btn--primary shrink-0">{isAr ? "أنشئ طلب عرض" : "Create an RFQ"}</Link>
        </section>
      </div>
    </div>
  );
}
