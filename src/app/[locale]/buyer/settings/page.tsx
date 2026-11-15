import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AccountSettings } from "@/components/dashboard/AccountSettings";
import { BUYER_NAV } from "@/lib/buyer-nav";

export default async function BuyerSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <AccountSettings locale={locale} role="buyer" />
    </DashboardShell>
  );
}
