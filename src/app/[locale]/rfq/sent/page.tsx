import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const isAr = raw === "ar";
  return staticPageMetadata(
    params,
    "/rfq/sent",
    isAr ? "تم إرسال الطلب | Hukum" : "Request sent | Hukum",
    isAr
      ? "تم استلام طلب عرض السعر. سنتابع المطابقة مع الموردين المناسبين."
      : "Your quote request was received. Matching with relevant suppliers is next."
  );
}

export default async function RfqSentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const sp = await searchParams;
  const ref = sp.ref || sp.id || "";

  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap hukum-page__wrap--narrow">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "طلبات العروض" : "Quote requests"}
          title={isAr ? "تم إرسال طلبك" : "Your request was sent"}
          arabic={isAr ? undefined : "تم إرسال الطلب"}
          lead={
            isAr
              ? "استلمنا طلب عرض السعر. سنطابق الموردين المناسبين ونبيّن الخطوات التالية في حسابك عند توفرها."
              : "We received your quote request. Relevant suppliers will be matched, and next steps will appear in your account when available."
          }
          crumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "طلب عرض سعر" : "Request quotes", href: `/${locale}/rfq` },
            { label: isAr ? "تم الإرسال" : "Sent" },
          ]}
        />

        <div className="hukum-card p-6 sm:p-8">
          <p className="hukum-badge-pill w-fit">{isAr ? "تم الاستلام" : "Received"}</p>
          {ref ? (
            <p className="mt-4 text-sm text-[var(--hukum-muted)]">
              {isAr ? "رقم المرجع:" : "Reference:"}{" "}
              <span className="font-semibold text-[var(--hukum-ink)] tabular-nums">{ref}</span>
            </p>
          ) : null}
          <ul className="mt-5 grid gap-2 text-sm leading-7 text-[var(--hukum-muted)]">
            {(isAr
              ? [
                  "راجع بريدك أو لوحة المشتري لمتابعة العروض الواردة.",
                  "يمكنك إرسال طلب إضافي إذا تغيّر النطاق أو الكميات.",
                  "للاحتياج العاجل، استخدم مساعدة التوريد أو واتساب.",
                ]
              : [
                  "Check your email or buyer dashboard for incoming quotations.",
                  "You can send another request if scope or quantities change.",
                  "For urgent needs, use sourcing help or WhatsApp.",
                ]
            ).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[var(--hukum-green)]" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/${locale}/buyer/rfqs`} className="hukum-btn hukum-btn--primary">
              {isAr ? "طلباتي" : "My requests"}
            </Link>
            <Link href={`/${locale}/sourcing-help`} className="hukum-btn hukum-btn--secondary">
              {isAr ? "مساعدة التوريد" : "Sourcing help"}
            </Link>
            <Link href={`/${locale}/products`} className="hukum-btn hukum-btn--ghost">
              {isAr ? "متابعة التصفح" : "Keep browsing"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
