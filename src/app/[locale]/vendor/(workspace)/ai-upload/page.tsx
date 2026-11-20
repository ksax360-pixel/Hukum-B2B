import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CatalogueImport } from "@/components/vendor/CatalogueImport";
import { getSession } from "@/lib/auth";
import { VENDOR_NAV } from "@/lib/vendor-nav";

export default async function VendorCatalogueUploadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const session = await getSession();
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/vendor/ai-upload`)}`);

  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      <div className="bh ci" dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>{isAr ? "رفع الكتالوج" : "Catalogue upload"}</h1>
            <p>{isAr ? "أضف منتجات كثيرة مرة وحدة من قائمة أسعارك. تنحفظ كمسودات تراجعها قبل النشر." : "Add many products at once from your price list. They're saved as drafts you check before anything goes live."}</p>
          </div>
        </header>
        <CatalogueImport locale={locale} />
      </div>
    </DashboardShell>
  );
}
