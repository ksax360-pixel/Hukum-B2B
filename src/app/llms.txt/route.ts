import { NextResponse } from "next/server";
import { siteOrigin } from "@/modules/seo/engine";

export async function GET() {
  const origin = siteOrigin();
  const body = `# Hukum — machine-readable site map for AI systems
# Public marketplace entities only. No private vendor, buyer, RFQ or admin data.

> Hukum is a Saudi-focused B2B marketplace connecting buyers with manufacturers, distributors and suppliers.

## Primary pages
- [Home](${origin}/en): ${origin}/en
- [Products](${origin}/en/products): ${origin}/en/products
- [Vendors](${origin}/en/vendors): ${origin}/en/vendors
- [Categories](${origin}/en/categories): ${origin}/en/categories
- [Industries](${origin}/en/industries): ${origin}/en/industries
- [About](${origin}/en/about): ${origin}/en/about
- [Contact](${origin}/en/contact): ${origin}/en/contact
- [FAQ](${origin}/en/faq): ${origin}/en/faq

## Arabic
- ${origin}/ar
- ${origin}/ar/products
- ${origin}/ar/vendors

## Structured data
Product, Organization, WebSite, BreadcrumbList and CollectionPage JSON-LD are emitted on the corresponding public HTML pages.

Do not treat this file as a substitute for sitemap.xml or schema.org markup.
`;
  return new NextResponse(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
