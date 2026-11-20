import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VendorHome } from "@/components/vendor/VendorHome";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Product } from "@/modules/products/product.model";
import { AnalyticsEvent } from "@/modules/platform/platform.model";
import { vendorCompleteness } from "@/modules/products/completeness";
import { User } from "@/modules/users/user.model";
import { VENDOR_NAV } from "@/lib/vendor-nav";
import { loadSupplierRequests, type SupplierRequestRow } from "@/lib/vendor-requests";

export default async function VendorDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/vendor/dashboard`)}`);

  let name = "Supplier";
  let productCount = 0;
  let views = 0;
  let verified = false;
  let storefrontHref: string | null = null;
  let checks: Array<{ key: string; label: string; ok: boolean }> = [];
  let score = 0;
  let rows: SupplierRequestRow[] = [];

  try {
    await connectDB();
    const user = await User.findById(session.id).select("name email").lean();
    name = (user as { name?: string } | null)?.name || session.email.split("@")[0];
    if (session.vendorId) {
      const doc = await Vendor.findById(session.vendorId).lean();
      if (doc) {
        const v = doc as { _id: unknown; slug?: { en?: string }; verificationStatus?: string };
        [productCount, views, rows] = await Promise.all([
          Product.countDocuments({ vendorId: v._id, status: "published" }),
          AnalyticsEvent.countDocuments({ vendorId: v._id, type: { $in: ["vendor_page_view", "vendor_view"] }, "meta.bot": { $ne: true } }),
          loadSupplierRequests(String(v._id), locale),
        ]);
        const c = vendorCompleteness(doc as Parameters<typeof vendorCompleteness>[0]);
        checks = c.checks;
        score = c.score;
        verified = v.verificationStatus === "verified";
        storefrontHref = v.slug?.en ? `/${locale}/vendors/${v.slug.en}` : null;
      }
    }
  } catch (e) {
    console.error("[vendor/dashboard]", e);
  }

  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      <VendorHome
        locale={locale}
        name={name}
        rows={rows}
        productCount={productCount}
        views={views}
        verified={verified}
        storefrontHref={storefrontHref}
        checks={checks}
        score={score}
      />
    </DashboardShell>
  );
}
