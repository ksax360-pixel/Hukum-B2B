import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/modules/users/user.model";
import { emptyBuyerDashboard, loadBuyerDashboardData } from "@/lib/buyer-dashboard";
import { BUYER_NAV } from "@/lib/buyer-nav";

export default async function BuyerDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session?.id) {
    redirect(`/${locale}/login?next=/${locale}/buyer/dashboard`);
  }

  // Vendors / admins should land on their own dashboards
  if (session.roles?.some((r) => ["admin", "super_admin", "platform_admin"].includes(r))) {
    redirect(`/${locale}/admin`);
  }
  if (session.roles?.some((r) => r.startsWith("vendor"))) {
    redirect(`/${locale}/vendor/dashboard`);
  }

  let name = "Buyer";
  let mobile = "";
  try {
    await connectDB();
    const user = await User.findById(session.id).select("name email mobile").lean();
    name =
      (user as { name?: string } | null)?.name ||
      session.email.split("@")[0] ||
      "Buyer";
    mobile = (user as { mobile?: string } | null)?.mobile || "";
  } catch {
    name = session.email.split("@")[0] || "Buyer";
  }

  let data = emptyBuyerDashboard(locale);
  try {
    await connectDB();
    data = await loadBuyerDashboardData(session.id, session.email, locale, mobile);
  } catch {
    data = emptyBuyerDashboard(locale);
  }

  const rankingItems =
    data.ranking.length > 0
      ? data.ranking
      : [
          {
            name: locale === "ar" ? "لا يوجد موردون محفوظون بعد" : "No saved vendors yet",
            value: "—",
            meta: locale === "ar" ? "ابدأ التصفح" : "browse",
          },
        ];

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <DashboardHome
        locale={locale}
        role="buyer"
        name={name}
        metrics={[
          { title: "Active RFQs", value: data.metrics.activeRfqs, icon: "file" },
          { title: "Quotations", value: data.metrics.quotations, icon: "quote" },
          { title: "Saved products", value: data.metrics.savedProducts, icon: "products" },
          {
            title: "Messages",
            value: data.metrics.messages + data.metrics.interests,
            icon: "messages",
          },
        ]}
        gauge={{
          title: "Top category",
          caption: "Share of your RFQs",
          label: data.gauge.label,
          percent: data.gauge.percent,
        }}
        ranking={{
          title: "Saved vendors",
          caption: "Vendors you follow or quote with",
          items: rankingItems,
        }}
        activity={{
          title: "Sourcing activity",
          caption: "RFQs & quotes · last 7 days",
          series: data.activitySeries,
        }}
        pipeline={{
          title: "RFQ pipeline",
          caption: "Where your requests sit",
          items: data.pipeline,
        }}
        recent={{
          title: "Recent RFQs",
          items:
            data.recent.length > 0
              ? data.recent
              : [
                  {
                    title: locale === "ar" ? "أنشئ أول طلب عرض سعر" : "Create your first RFQ",
                    meta: locale === "ar" ? "ابدأ" : "Start",
                    href: `/${locale}/rfq`,
                  },
                  {
                    title: locale === "ar" ? "تصفح المنتجات" : "Browse products",
                    meta: locale === "ar" ? "سوق" : "Marketplace",
                    href: `/${locale}/products`,
                  },
                ],
        }}
        actions={[
          { title: "Create RFQ", href: `/${locale}/rfq` },
          { title: "Discover products", href: `/${locale}/products` },
          { title: "Find vendors", href: `/${locale}/vendors` },
          { title: "Open tickets", href: `/${locale}/buyer/tickets` },
        ]}
      />
    </DashboardShell>
  );
}
