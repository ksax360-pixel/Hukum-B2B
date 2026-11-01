import { NextResponse } from "next/server";
import { siteOrigin } from "@/modules/seo/engine";

export async function GET() {
  const origin = siteOrigin();
  const staging =
    process.env.VERCEL_ENV === "preview" ||
    process.env.NOINDEX === "1" ||
    /localhost|vercel\.app|netlify\.app|staging/i.test(origin);

  if (staging) {
    const body = `User-agent: *
Disallow: /

# Staging / preview — do not index
Sitemap: ${origin}/sitemap.xml
`;
    return new NextResponse(body, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
    });
  }

  const body = `User-agent: *
Allow: /
Disallow: /account/
Disallow: /dashboard/
Disallow: /vendor/dashboard/
Disallow: /*/vendor/dashboard
Disallow: /*/vendor/dashboard/
Disallow: /*/buyer/
Disallow: /*/admin/
Disallow: /api/
Disallow: /*?*sort=

Sitemap: https://www.hukum.sa/sitemap.xml
`;

  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
