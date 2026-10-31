import type { ReactNode } from "react";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(
    params,
    "/rfq",
    "Request for Quote | Hukum",
    "Submit a sourcing brief and invite relevant Hukum suppliers.",
    { indexable: false }
  );
}

export default function RfqLayout({ children }: { children: ReactNode }) {
  return children;
}
