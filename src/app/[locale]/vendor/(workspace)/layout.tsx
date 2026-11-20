import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/** The supplier workspace is for supplier accounts (and staff). Others go to sign-in or their own workspace. */
export default async function VendorLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw === "ar" ? "ar" : "en";
  const session = await getSession();
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/vendor/dashboard`)}`);
  const staff = session.roles?.some((r) => ["admin", "super_admin", "platform_admin"].includes(r));
  if (!session.vendorId && !staff) redirect(`/${locale}/buyer/dashboard`);
  return children;
}
