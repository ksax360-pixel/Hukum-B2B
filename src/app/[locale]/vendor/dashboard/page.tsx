import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Product } from "@/modules/products/product.model";
import { AnalyticsEvent } from "@/modules/platform/platform.model";
import { vendorCompleteness } from "@/modules/products/completeness";
import { User } from "@/modules/users/user.model";

const nav = [
  { href: "/vendor/dashboard", label: "Dashboard" },
  { href: "/vendor/company", label: "Company" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/ai-upload", label: "AI Upload" },
  { href: "/vendor/rfqs", label: "RFQs" },
  { href: "/vendor/quotations", label: "Quotations" },
  { href: "/vendor/analytics", label: "Analytics" },
  { href: "/vendor/documents", label: "Documents" },
  { href: "/vendor/subscription", label: "Subscription" },
  { href: "/vendor/settings", label: "Settings" },
];

export default async function VendorDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);

  let productCount = 0;
  let views = 0;
  let contacts = 0;
  let completeness = 0;
  let name = "Vendor";

  try {
    const session = await getSession();
    if (session?.id) {
      await connectDB();
      const user = await User.findById(session.id).select("name email").lean();
      name = (user as { name?: string } | null)?.name || session.email.split("@")[0];
    }
    if (session?.vendorId) {
      await connectDB();
      const doc = await Vendor.findById(session.vendorId).lean();
      if (doc) {
        productCount = await Product.countDocuments({ vendorId: doc._id, status: "published" });
        views = await AnalyticsEvent.countDocuments({
          vendorId: doc._id,
          type: { $in: ["vendor_page_view", "vendor_view"] },
          "meta.bot": { $ne: true },
        });
        contacts = await AnalyticsEvent.countDocuments({
          vendorId: doc._id,
          type: { $regex: /contact|whatsapp|inquiry|rfq/i },
          "meta.bot": { $ne: true },
        });
        completeness = vendorCompleteness(doc as Parameters<typeof vendorCompleteness>[0]).score;
      }
    }
  } catch {
    /* offline */
  }

  return (
    <DashboardShell locale={locale} title="Vendor" nav={nav}>
      <DashboardHome
        locale={locale}
        role="vendor"
        name={name}
        metrics={[
          { title: "Products", value: productCount || 0, icon: "products" },
          { title: "Website visits / week", value: views || 0, icon: "globe" },
          { title: "Leads / month", value: contacts || 0, icon: "file" },
          { title: "Profile score", value: `${completeness || 0}%`, icon: "spark" },
        ]}
        gauge={{
          title: "Top listing",
          caption: "Share of page views",
          label: productCount ? "Your catalogue" : "No listings yet",
          percent: completeness || 0,
        }}
        ranking={{
          title: "Top products",
          caption: "Most viewed this week",
          items: [],
        }}
        activity={{
          title: "Leads & traffic",
          caption: "Contacts vs storefront visits",
          series: [0, 0, 0, 0, 0, 0, 0],
        }}
        pipeline={{
          title: "Enquiry mix",
          caption: "How buyers reach you",
          items: [
            { label: "WhatsApp", value: 14 },
            { label: "RFQ", value: 8 },
            { label: "Profile", value: 6 },
            { label: "Email", value: 3 },
          ],
        }}
        recent={{
          title: "Recent listings",
          items: [
            { title: "Nitrile examination gloves", meta: "Published", href: `/${locale}/vendor/products` },
            { title: "Industrial first-aid cabinet", meta: "Published", href: `/${locale}/vendor/products` },
            { title: "Hi-vis safety vest", meta: "Draft", href: `/${locale}/vendor/products` },
            { title: "Spill kit 120L", meta: "Published", href: `/${locale}/vendor/products` },
          ],
        }}
        actions={[
          { title: "Add products", href: `/${locale}/vendor/products` },
          { title: "AI upload", href: `/${locale}/vendor/ai-upload` },
          { title: "Open tickets", href: `/${locale}/vendor/tickets` },
          { title: "Edit company", href: `/${locale}/vendor/company` },
        ]}
      />
    </DashboardShell>
  );
}
