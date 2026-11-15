import { redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { sellerLoginUrl } from "@/lib/seller-admin";

/** "Supplier sign in" goes straight to the supplier portal (no interstitial page). */
export default async function VendorSignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  redirect(sellerLoginUrl(isLocale(raw) ? raw : "en"));
}
