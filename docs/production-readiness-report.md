# Hukum production-readiness report

Date: 2026-11-01  
Site: https://www.hukum.sa  
Scope: SEO, sharing, robots/sitemap/llms, security headers, responsive/a11y plumbing. Visual design unchanged.

## 1. Page titles & descriptions (EN | AR)

| Page | EN title | AR title | EN description (summary) |
|------|----------|----------|---------------------------|
| `/` | Find verified suppliers in Saudi Arabia | اعثر على موردين موثوقين في السعودية | Search verified suppliers, one request, free quotes |
| `/categories` | Browse 49 B2B categories in Saudi Arabia | تصفّح ٤٩ تصنيفاً للأعمال في السعودية | 49 sectors, verified suppliers |
| `/vendors` | Verified vendors & manufacturers \| Hukum | موردون ومصانع موثّقون \| حكم | CR-checked manufacturers & distributors |
| `/products` | B2B products from Saudi suppliers \| Hukum | منتجات B2B من موردين سعوديين \| حكم | Search & request quotes |
| `/request-quotes` / `/rfq` | Request quotes / Create a precise RFQ | اطلب عروض أسعار / أنشئ طلب عرض سعر | One RFQ → multiple vendors |
| `/sourcing-help` | Get sourcing help & VIP Concierge | مساعدة التوريد وخدمة الكونسيرج VIP | RFQ, WhatsApp, BOQ, VIP |
| `/how-it-works` | How Hukum works for buyers | كيف يعمل حكم للمشترين | Search → quote → compare → connect |
| `/verification` | Supplier verification levels \| Hukum | مستويات تحقق الموردين \| حكم | Registered / CR / Verified |
| `/become-a-vendor` | Become a supplier on Hukum | كن مورداً على حكم | Free through 2027 |
| `/about` | About Hukum — Saudi B2B marketplace | عن حكم — سوق B2B سعودي | Bilingual B2B marketplace |
| `/contact` | Contact Hukum sourcing & support | تواصل مع حكم للتوريد والدعم | Channels & offices |
| `/faq` | FAQ — Hukum B2B marketplace | الأسئلة الشائعة — سوق حكم | Registration, RFQs, verification |
| `/help` | Help centre \| Hukum | مركز المساعدة \| حكم | Buyer/supplier guides |
| `/report` | Report a concern \| Hukum | الإبلاغ عن مشكلة \| حكم | Safe reporting |
| `/terms` | Terms of service \| Hukum | شروط الاستخدام \| حكم | Platform terms |
| `/privacy` | Privacy policy (PDPL) \| Hukum | سياسة الخصوصية (PDPL) \| حكم | PDPL privacy |
| `/marketplace-rules` | Marketplace rules \| Hukum | قواعد السوق \| حكم | Conduct rules |
| `/compare` | Compare products \| Hukum | قارن المنتجات \| حكم | Side-by-side compare |
| `/industries` | Industries across Saudi Arabia \| Hukum | قطاعات الأعمال في السعودية \| حكم | Industry catalogue |
| `/blog` | Hukum blog — B2B sourcing insights | مدونة حكم — رؤى توريد B2B | Insights |
| `/vendors/cities` | Vendors by city in Saudi Arabia | الموردون حسب المدينة في السعودية | City directory |
| `/vendors/brands` | Brands & authorised distributors | العلامات والموزعون المعتمدون | Brand partners |
| `/vendors/manufacturers` | Manufacturers on Hukum | المصانع على حكم | Factories |
| `/vendors/made-in-saudi` | Made in Saudi suppliers \| Hukum | موردو صنع في السعودية \| حكم | Local supply |
| `/upload-boq` | Upload a BOQ \| Hukum | رفع جدول كميات \| حكم | BOQ → RFQ |
| `/categories/{slug}` | `{Name} suppliers in Saudi Arabia` | `موردو {Name} في السعودية` | Dynamic sector SEO |
| `/products/{slug}` | Product name \| brand | اسم المنتج | Product schema |
| `/vendors/{slug}` | Vendor name \| verified supplier | اسم المورد \| مورد موثّق | LocalBusiness schema |

Full bilingual OG titles/descriptions are auto-composed as `EN | AR` for WhatsApp/LinkedIn/X.

## 2. Fixes by section

### SEO
- Central `PAGE_SEO` catalog + `composeMetadata` with unique titles/descriptions, canonical, `en-SA` / `ar-SA` / `x-default` hreflang.
- Default share image absolute URL; bilingual `og:*` + Twitter cards.
- `<html lang>` / `dir` via `DocumentLocale` (`lang="ar" dir="rtl"`).
- JSON-LD: Organization + WebSite(+SearchAction) on home; BreadcrumbList / ItemList on categories; FAQPage on FAQ; Product on PDP; LocalBusiness on vendor profiles.
- 301 redirects for legacy paths (`/category/*`, `/suppliers`, `/become-a-supplier`, etc.).

### robots.txt
- Production allow/disallow list + `Sitemap: https://www.hukum.sa/sitemap.xml`.
- Preview/staging (`VERCEL_ENV=preview` or `NOINDEX=1`) → `Disallow: /`.

### sitemap.xml
- Auto-generated for EN+AR static public pages, 49 sectors, products, vendors, industries, marketplace entities with hreflang alternates.
- Excludes account/dashboard/error surfaces.

### llms.txt
- Rewritten to the requested Hukum positioning and key pages (locale-prefixed URLs).

### Social sharing
- Saved `/og/hukum-share.jpg` (1200×630, ~25 KB).
- Favicon ICO + SVG, apple-touch-icon 180×180, `site.webmanifest` (theme `#17634B`).

### Responsive / a11y plumbing
- Form controls `font-size: 16px` (no iOS zoom).
- Button min-height 44px on `.hukum-btn`.
- Language switcher already preserves path when swapping `en`↔`ar`.

### Security / performance config
- Security headers: HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP baseline.
- Next image formats: AVIF + WebP.
- Fonts: `display: "swap"` + preload on primary faces.

## 3. Lighthouse

**Before / after:** Not measured in this environment (no production deploy URL authenticated for Lighthouse CI in-session).

Recommended after deploy:
```bash
npx lighthouse https://www.hukum.sa/en --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo
```
Target: 90+ on Performance, SEO, Accessibility, Best Practices.

## 4. Incomplete / needs your input

1. **WhatsApp business number** — `SITE_CONTACT.whatsapp` is empty; `wa.me` buttons fall back until you set an E.164 number (without `+`).
2. **Public phone** — still empty until confirmed.
3. **Mailbox DNS** — contact emails switched to `@hukum.sa` (`hello@`, `vendors@`, `buyers@`, `partners@`, `support@`). Confirm MX/inboxes exist.
4. **WWW / HTTPS apex redirects** — configure at DNS/CDN (Cloudflare/Vercel) so `hukum.sa` → `https://www.hukum.sa` (or reverse) consistently; app sets `metadataBase` from `NEXT_PUBLIC_APP_URL`.
5. **Set `NEXT_PUBLIC_APP_URL=https://www.hukum.sa`** in production env.
6. **Facebook Sharing Debugger / LinkedIn inspector / WhatsApp** — must be run against the live URL after deploy (cannot complete from local).
7. **Google Rich Results Test** — validate live homepage, a category, a product, FAQ after deploy.
8. **Lighthouse scores** — run on production; not available pre-deploy here.
9. **Full click-through QA** of every dashboard deep link — public chrome + SEO plumbing done; authenticated buyer/vendor flows need staging credentials.
10. **Legal copy** — terms/privacy remain counsel scaffolds; replace before launch if not already approved.

## 5. Env checklist

```
NEXT_PUBLIC_APP_URL=https://www.hukum.sa
# Preview only:
NOINDEX=1
```
