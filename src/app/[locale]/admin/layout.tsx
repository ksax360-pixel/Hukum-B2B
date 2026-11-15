import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

const STAFF = ["admin", "super_admin", "platform_admin", "product_admin", "vendor_verification_admin", "content_admin", "seo_manager", "finance_admin", "support_admin"];

/** Admin is staff-only: signed-out users go to sign-in, everyone else back to their own workspace. */
export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw === "ar" ? "ar" : "en";
  const session = await getSession();
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/admin`)}`);
  if (!session.roles?.some((r) => STAFF.includes(r))) redirect(`/${locale}/${session.vendorId ? "vendor" : "buyer"}/dashboard`);
  return children;
}
