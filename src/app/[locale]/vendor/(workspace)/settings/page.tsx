import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AccountSettings } from "@/components/dashboard/AccountSettings";
import { VENDOR_NAV } from "@/lib/vendor-nav";

export default async function VendorSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      <AccountSettings locale={locale} role="vendor" />
    </DashboardShell>
  );
}
