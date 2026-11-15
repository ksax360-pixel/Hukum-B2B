import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BuyerRequestsHome } from "@/components/buyer/BuyerRequestsHome";
import { loadBuyerRequests, type BuyerRequestRow } from "@/lib/buyer-requests";
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

  let rows: BuyerRequestRow[] = [];
  try {
    rows = await loadBuyerRequests(session.id, locale);
  } catch (e) {
    console.error("[buyer/dashboard] requests", e);
  }

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]} allowDark={false}>
      <BuyerRequestsHome
        locale={locale}
        name={name}
        rows={rows}
        savedCount={data.metrics.savedProducts}
        supplierCount={data.ranking.length}
      />
    </DashboardShell>
  );
}
