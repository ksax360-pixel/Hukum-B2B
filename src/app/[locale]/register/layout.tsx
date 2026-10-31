import type { ReactNode } from "react";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  return staticPageMetadata(
    params,
    "/register",
    isAr ? "إنشاء حساب | Hukum" : "Register | Hukum",
    isAr ? "أنشئ حساب مشتري أو مورد على Hukum." : "Create a Hukum buyer or vendor account.",
    { indexable: false }
  );
}

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
