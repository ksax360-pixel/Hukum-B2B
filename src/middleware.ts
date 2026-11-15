import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "./i18n/config";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const segment = request.nextUrl.pathname.split("/").filter(Boolean)[0] || "";
  const locale = isLocale(segment) ? segment : defaultLocale;
  response.headers.set("x-hukum-locale", locale);
  return response;
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
