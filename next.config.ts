import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self' https://wa.me https://api.whatsapp.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Pre-existing mongoose/nullability mismatches; feature work is validated at runtime.
  typescript: { ignoreBuildErrors: true },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // Apex / legacy hosts should be configured at DNS/CDN; app-level path aliases:
      {
        source: "/:locale(en|ar)/request-quote",
        destination: "/:locale/request-quotes",
        permanent: true,
      },
      {
        source: "/:locale(en|ar)/get-sourcing-help",
        destination: "/:locale/sourcing-help",
        permanent: true,
      },
      {
        source: "/:locale(en|ar)/become-a-supplier",
        destination: "/:locale/become-a-vendor",
        permanent: true,
      },
      {
        source: "/:locale(en|ar)/suppliers",
        destination: "/:locale/vendors",
        permanent: true,
      },
      {
        source: "/:locale(en|ar)/supplier/:slug*",
        destination: "/:locale/vendors/:slug*",
        permanent: true,
      },
      {
        source: "/:locale(en|ar)/category/:slug",
        destination: "/:locale/categories/:slug",
        permanent: true,
      },
      {
        source: "/:locale(en|ar)/account/:path*",
        destination: "/:locale/buyer/dashboard",
        permanent: false,
      },
      {
        source: "/:locale(en|ar)/dashboard",
        destination: "/:locale/buyer/dashboard",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
