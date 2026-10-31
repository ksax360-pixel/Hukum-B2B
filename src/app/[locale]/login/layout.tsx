import type { ReactNode } from "react";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  return staticPageMetadata(
    params,
    "/login",
    isAr ? "تسجيل الدخول | Hukum" : "Sign in | Hukum",
    isAr ? "سجّل الدخول إلى حسابك في Hukum." : "Sign in to your Hukum account.",
    { indexable: false }
  );
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
