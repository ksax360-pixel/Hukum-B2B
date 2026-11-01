import type { ReactNode } from "react";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/register", "ignored", undefined, {
    indexable: false,
    seoKey: "register",
  });
}

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
