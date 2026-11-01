import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { isLocale, type Locale } from "@/i18n/config";
import { sellerLoginUrl } from "@/lib/seller-admin";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/vendor/sign-in", "ignored", undefined, {
    indexable: false,
    seoKey: "vendor-sign-in",
  });
}

export default async function VendorSignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  return (
    <main className="hukum-page">
      <div className="hukum-page__wrap hukum-page__wrap--narrow">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "للموردين" : "For vendors"}
          title={isAr ? "دخول المورد" : "Vendor sign in"}
          lead={isAr
            ? "ادخل إلى لوحة المورد لإدارة المنتجات وطلبات عروض الأسعار."
            : "Access the vendor panel to manage products and quote requests."}
          goldEyebrow
        />
        <div className="flex flex-wrap gap-3">
        <a
          href={sellerLoginUrl()}
          className="hukum-btn hukum-btn--primary hukum-btn--lg"
        >
          {isAr ? "دخول لوحة المورد" : "Open vendor panel"}
        </a>
        <Link
          href={`/${locale}/login`}
          className="hukum-btn hukum-btn--secondary hukum-btn--lg"
        >
          {isAr ? "تسجيل دخول المشتري" : "Buyer sign in"}
        </Link>
        </div>
      </div>
    </main>
  );
}
