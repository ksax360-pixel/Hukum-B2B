import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/terms", "Terms of Service | Hukum", "Hukum / Hukum terms of service.");
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const effective = "2026-01-01";
  const region = process.env.DATA_REGION || "SA-central (target)";

  return (
    <div className="container-custom section max-w-3xl">
      <p className="label-caps mb-3">{isAr ? "قانوني" : "Legal"}</p>
      <h1 className="text-3xl md:text-4xl font-semibold text-[var(--ink)] mb-2">
        {isAr ? "الشروط والأحكام" : "Terms of service"}
      </h1>
      <p className="mb-6 text-xs text-[var(--muted)]">
        {isAr ? `ساري من ${effective} · منطقة البيانات: ${region}` : `Effective ${effective} · Data region: ${region}`}
      </p>
      <div className="surface-card space-y-6 p-8 text-sm leading-relaxed text-[var(--ink-soft)]">
        <p className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-xs">
          {isAr
            ? "نسخة جاهزة للمراجعة القانونية — تُستبدل بنص المستشار قبل الإطلاق العام. لا تُعتبر هذه الصفحة عرضاً ملزماً حتى اعتمادها."
            : "Counsel-ready scaffold — replace with counsel-approved text before public launch. Not a binding offer until adopted."}
        </p>
        <section className="space-y-2">
          <h2 className="font-semibold text-[var(--ink)]">{isAr ? "استخدام المنصة" : "Platform use"}</h2>
          <p>
            {isAr
              ? "يُسمح بالاستخدام للأغراض التجارية المشروعة وفق قواعد السوق. التواصل الأول عبر وسيط حكم؛ كشف جهات الاتصال يتطلب موافقة متبادلة وPDPL."
              : "Use is permitted for legitimate commercial purposes under Marketplace Rules. First contact goes through Hukum relay; contact reveal requires mutual consent and PDPL."}
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold text-[var(--ink)]">{isAr ? "العروض والصفقات" : "Quotes & deals"}</h2>
          <p>
            {isAr
              ? "العروض على حكم ليست عروضاً ملزمة عبر المنصة ما لم يُتفق خلاف ذلك كتابةً بين الأطراف."
              : "Quotations on Hukum are not binding offers via the platform unless parties agree otherwise in writing."}
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold text-[var(--ink)]">{isAr ? "السلع المنظّمة" : "Regulated goods"}</h2>
          <p>
            {isAr
              ? "يُحظر إدراج الأسلحة والمتفجرات. الأدوية والكيماويات الخطرة تتطلب ترخيصاً وتحقق فئة."
              : "Weapons and explosives are prohibited. Pharmaceuticals and hazardous chemicals require license and category checks."}
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold text-[var(--ink)]">{isAr ? "المسؤولية" : "Liability"}</h2>
          <p>
            {isAr
              ? "حكم وسيط؛ لا تحتفظ بأموال المشترين. الحماية والتمويل واللوجستيات عبر شركاء مرخّصين."
              : "Hukum is an intermediary and never holds buyer funds. Payment protection, financing and logistics run via licensed partners."}
          </p>
        </section>
      </div>
    </div>
  );
}
