import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SeoSettings } from "@/modules/seo/seo.model";
import { siteOrigin } from "@/modules/seo/engine";

const SAFE_DEFAULT = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /*/admin
Disallow: /*/admin/
Disallow: /*/buyer
Disallow: /*/buyer/
Disallow: /*/vendor/dashboard
Disallow: /*/vendor/products
Disallow: /*/vendor/company
Disallow: /*/vendor/settings
Disallow: /*/vendor/rfqs
Disallow: /*/vendor/quotations
Disallow: /*/vendor/analytics
Disallow: /*/vendor/documents
Disallow: /*/vendor/subscription
Disallow: /*/vendor/ai-upload
Disallow: /*/login
Disallow: /*/register
Disallow: /*?*price=
Disallow: /*?*brand=
Disallow: /*?*ram=
Disallow: /*?*storage=

Sitemap: ${siteOrigin()}/sitemap.xml
`;

export async function GET() {
  let body = SAFE_DEFAULT;
  try {
    await connectDB();
    const row = await SeoSettings.findOne({ key: "default" }).lean();
    if (row?.robotsTxt && !/disallow:\s*\/$/i.test(row.robotsTxt)) {
      body = row.robotsTxt.includes("Sitemap:")
        ? row.robotsTxt
        : `${row.robotsTxt.trim()}\n\nSitemap: ${siteOrigin()}/sitemap.xml\n`;
    }
  } catch {
    /* use default */
  }
  return new NextResponse(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
