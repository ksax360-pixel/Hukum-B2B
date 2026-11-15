import type { ReactNode } from "react";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/compare", "ignored", undefined, { seoKey: "compare" });
}

export default function CompareLayout({ children }: { children: ReactNode }) {
  return children;
}
