import type { ReactNode } from "react";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/rfq", "ignored", undefined, { seoKey: "rfq" });
}

export default function RfqLayout({ children }: { children: ReactNode }) {
  return children;
}
