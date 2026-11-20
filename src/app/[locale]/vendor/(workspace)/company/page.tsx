import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StorefrontEditor, type EditorVendor } from "@/components/vendor/StorefrontEditor";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { VENDOR_NAV } from "@/lib/vendor-nav";
import { Vendor } from "@/modules/vendors/vendor.model";

type Loc = { en?: string; ar?: string };
type Design = {
  headline?: Loc; tagline?: Loc; bannerText?: Loc; ctaLabel?: Loc; primaryColor?: string; logo?: string; bannerImages?: string[];
  coverImage?: string; showProducts?: boolean; showCertifications?: boolean; showContactCta?: boolean;
};
type Doc = {
  _id: unknown; legalName?: Loc; tradeName?: string; companyType?: string; location?: { city?: string }; yearEstablished?: number;
  website?: string; phone?: string; email?: string; description?: Loc; logo?: string; slug?: { en?: string }; verificationStatus?: string;
  storefront?: { published?: Design; pending?: Design; status?: string; rejectionReason?: string };
};

export default async function VendorStorefrontEditorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  const session = await getSession();
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/vendor/company`)}`);

  let vendor: EditorVendor | null = null;
  try {
    await connectDB();
    const v = session.vendorId ? ((await Vendor.findById(session.vendorId).lean()) as Doc | null) : null;
    if (v) {
      const sf = v.storefront || {};
      // Edit from the pending draft when there is one, so a supplier sees what they sent.
      const base: Design = (sf.status === "pending" || sf.status === "rejected" ? sf.pending : sf.published) || sf.published || {};
      const L = (x?: Loc): Loc => ({ en: x?.en || "", ar: x?.ar || "" });
      vendor = {
        id: String(v._id),
        name: (isAr ? v.legalName?.ar || v.legalName?.en : v.legalName?.en || v.legalName?.ar) || v.tradeName || "",
        verified: v.verificationStatus === "verified",
        tradeName: v.tradeName || "",
        legalName: L(v.legalName),
        companyType: v.companyType || "trading_company",
        city: v.location?.city || "",
        yearEstablished: v.yearEstablished,
        website: v.website || "",
        phone: v.phone || "",
        email: v.email || "",
        description: L(v.description),
        publicHref: v.slug?.en ? `/${locale}/vendors/${v.slug.en}` : null,
        review: { status: sf.status || "none", reason: sf.rejectionReason || "" },
        design: {
          headline: L(base.headline), tagline: L(base.tagline), bannerText: L(base.bannerText), ctaLabel: L(base.ctaLabel),
          primaryColor: base.primaryColor && /^#[0-9a-f]{6}$/i.test(base.primaryColor) ? base.primaryColor : "#17634B",
          logo: base.logo || v.logo || "",
          banner: base.bannerImages?.find(Boolean) || base.coverImage || "",
          showProducts: base.showProducts !== false,
          showCertifications: base.showCertifications !== false,
          showContactCta: base.showContactCta !== false,
        },
      };
    }
  } catch (e) {
    console.error("[vendor/company]", e);
  }

  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      {vendor ? (
        <StorefrontEditor locale={locale} vendor={vendor} />
      ) : (
        <p className="pdp2-empty vrq-empty">
          {isAr ? "ما فيه ملف مورد مربوط بحسابك. سجّل كمورد أو تواصل مع الدعم." : "No supplier profile is linked to this account. Register as a supplier or contact support."}
        </p>
      )}
    </DashboardShell>
  );
}
