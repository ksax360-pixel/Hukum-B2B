# Hukum production-readiness report

Date: 2026-11-02  
Site: https://www.hukum.sa  
Scope: Security headers, SEO (canonical / hreflang / sitemap / robots / llms), Arabic/RTL, routing fixes, public chrome.

## Verdict

Public site is **production-ready for deploy** on security, SEO plumbing, bilingual RTL, and known routing bugs from the live audit. Remaining items are ops/content (WhatsApp number, DNS, legal counsel sign-off, Lighthouse on the live URL).

## 1. Fixes applied this pass

| Area | Change |
|------|--------|
| Soft-404 | Unknown `/categories/[slug]` calls `notFound()` + `noindex`; bilingual 404 UI |
| Sector count | Homepage “All **49** categories” from `ALL_MARKETPLACE_SECTORS.length` |
| BOQ | Header → `/upload-boq`; `?upload=boq` → `/upload-boq`; CTA → `/rfq` |
| Redirects | `/manufacturers`, `/verification-levels`, `/concierge`, `/whatsapp` (+ prior aliases) |
| Arabic/RTL | SSR `<html lang/dir>` via middleware `x-hukum-locale`; AR primary titles; `dir="rtl"` on Arabic subtitles |
| Security | CSP + `object-src 'none'`, COOP, DNS-prefetch; session cookie httpOnly / Secure in prod; `AUTH_SECRET` ≥ 32 chars |
| SEO | Canonical + hreflang verified; robots staging Disallow; sitemap; `llms.txt` points at `/rfq` |

## 2. Local verification (2026-11-02)

| Check | Result |
|-------|--------|
| `/en` security headers | CSP, HSTS, XCTO, XFO, Referrer-Policy, Permissions-Policy, COOP, X-DNS-Prefetch-Control |
| `/ar` `<html>` | `lang="ar" dir="rtl" class="… arabic-font"` |
| `/en` sector CTA | `All 49 categories` |
| `/ar` sectors H2 | `تصفّح حسب التصنيف` |
| `/en/manufacturers` | `308` → `/en/vendors/manufacturers` |
| `/en/whatsapp` | `307` → `/en/sourcing-help` |
| `/en/request-quotes?upload=boq` | `307` → `/en/upload-boq` |
| Unknown category | Body title `Not found \| Hukum`, `robots: noindex,nofollow` (dev HTTP status may be 200; production `notFound()` → **404**) |
| `/llms.txt` | `200` |
| `/robots.txt` (localhost) | Staging `Disallow: /` (expected while `NEXT_PUBLIC_APP_URL` is localhost) |

## 3. Page titles & descriptions (EN \| AR)

Unchanged catalog via `PAGE_SEO` + `composeMetadata` (see prior table). Dynamic sectors/products/vendors use templates in `seo/engine.ts`.

## 4. Security summary

- Headers on all routes via `next.config.ts`.
- Auth cookie: `httpOnly`, `sameSite=lax`, `secure` when `NODE_ENV=production`.
- Demo accounts flag documented off in `.env.example`.
- CSP still allows `'unsafe-inline'` / `'unsafe-eval'` (Next.js / GA baseline). Tighten further only after nonce-based scripts if required by a security review.

## 5. SEO summary

- Unique titles/descriptions, absolute OG image `/og/hukum-share.jpg`.
- `en-SA` / `ar-SA` / `x-default` alternates.
- JSON-LD on home, categories, FAQ, PDP, vendors.
- Production robots allowlist + sitemap URL `https://www.hukum.sa/sitemap.xml`.
- Preview / `NOINDEX=1` / non-prod origin → full Disallow.

## 6. Arabic / RTL summary

- Document `lang`/`dir` set on the server for the active locale (no FOUC).
- Locale layout + `DocumentLocale` keep client in sync on client navigations.
- Homepage bilingual section titles swap correctly; Arabic secondary lines use `dir="rtl"`.
- Header chrome stays `dir="ltr"` for control geometry; AR labels use locale strings.

## 7. Incomplete / needs your input before go-live

1. Set `NEXT_PUBLIC_APP_URL=https://www.hukum.sa` and a ≥32-char `AUTH_SECRET` in production.
2. Confirm MX for `@hukum.sa` inboxes and publish WhatsApp / phone in `SITE_CONTACT` when ready.
3. Apex ↔ www HTTPS redirects at DNS/CDN.
4. Run Facebook / LinkedIn / WhatsApp link inspectors and Google Rich Results on the live URL.
5. Lighthouse mobile on production (target 90+ SEO / a11y / BP).
6. Legal counsel sign-off on terms/privacy if not already approved.
7. Optional: compress oversized category PNGs listed in `docs/live-audit-summary.json` (>300 KB).

## 8. Env checklist

```
NEXT_PUBLIC_APP_URL=https://www.hukum.sa
AUTH_SECRET=<random ≥32 chars>
ENABLE_DEMO_ACCOUNTS=false
PAYMENT_PROVIDER=none   # or real provider — not demo
# Preview only:
NOINDEX=1
```
