import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { isLocale, type Locale } from "@/i18n/config";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/privacy", "ignored", undefined, { seoKey: "privacy" });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const region = process.env.DATA_REGION || "SA-central (target)";

  return (
    <main className="hukum-page">
      <div className="hukum-page__wrap hukum-page__wrap--narrow">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "قانوني · PDPL" : "Legal · PDPL"}
          title={isAr ? "سياسة الخصوصية" : "Privacy policy"}
          lead={isAr ? `منطقة المعالجة الأساسية: ${region}` : `Primary processing region: ${region}`}
          goldEyebrow
        />
        <div className="hukum-card space-y-6 p-8 text-sm leading-relaxed text-[var(--hukum-muted)]">
        <p className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-xs">
          {isAr
            ? "مسودة متوافقة مع نظام حماية البيانات الشخصية (PDPL) — للمراجعة القانونية قبل الإطلاق."
            : "PDPL-aligned scaffold for counsel review before public launch."}
        </p>
        <section className="space-y-2">
          <h2 className="font-semibold text-[var(--hukum-ink)]">{isAr ? "جمع البيانات" : "Data we collect"}</h2>
          <p>
            {isAr
              ? "حسابات، طلبات أسعار، سجلات الكشف عن جهات الاتصال (مُجزّأة)، رسائل الوسيط، ومقاييس الاستخدام."
              : "Accounts, RFQs, contact-reveal audits (hashed phones), Hukum relay messages, and usage metrics."}
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold text-[var(--hukum-ink)]">{isAr ? "الموافقة والكشف" : "Consent & reveal"}</h2>
          <p>
            {isAr
              ? "لا نكشف أرقام الموردين عبر الوكيل دون تسجيل أو تحقق جوال + موافقة PDPL. التواصل الأول عبر وسيط حكم."
              : "We do not share supplier numbers via the agent without sign-in or phone OTP + PDPL consent. First contact uses Hukum relay."}
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold text-[var(--hukum-ink)]">{isAr ? "النقل خارج المملكة" : "Cross-border transfers"}</h2>
          <p>
            {isAr
              ? "إن لزم نقل محدود خارج السعودية، يُجرى تقييم نقل وفق PDPL. الهدف: استضافة النواة في منطقة سعودية."
              : "If limited processing outside Saudi Arabia is required, transfer assessments apply under PDPL. Target: Saudi-region core hosting."}
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold text-[var(--hukum-ink)]">{isAr ? "حقوقك" : "Your rights"}</h2>
          <p>
            {isAr ? (
              <>
                اطلب التصدير أو الحذف من{" "}
                <Link href={`/${locale}/buyer/privacy`} className="text-[var(--hukum-green)]">
                  خصوصية المشتري
                </Link>
                .
              </>
            ) : (
              <>
                Request export or deletion from{" "}
                <Link href={`/${locale}/buyer/privacy`} className="text-[var(--hukum-green)]">
                  buyer privacy
                </Link>
                .
              </>
            )}
          </p>
        </section>
        </div>
      </div>
    </main>
  );
}
