import type { ReactNode } from "react";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/login", "ignored", undefined, {
    indexable: false,
    seoKey: "login",
  });
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
