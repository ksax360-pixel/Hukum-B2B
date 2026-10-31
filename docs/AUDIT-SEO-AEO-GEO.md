# Kingdom Trade — SEO / AEO / GEO / LLM Discovery Audit & Remediation

**Date:** 2026-09-24  
**Scope:** Arabic-first bilingual discovery architecture validation and P0/P1 fixes.

## Executive summary

The persistent **Marketplace Entity** layer (`/c/{slug}`), product→entity pipeline, AEO provenance, faceted noindex, and admin SEO control center were already in place. The audit found the stack was still **English-biased** (scores, hreflang `x-default`, SEO templates, catalog matching) and lacked a dedicated **GEO** + **LLM knowledge** surface. Those gaps are remediated in this pass.

## Architecture (verified)

| Layer | Status |
| --- | --- |
| Product offer vs ProductEntity | OK — offers stay on `Product`; canonical `ProductEntity` |
| MarketplaceEntity (vendor-independent) | OK — survives vendor removal; counts refresh |
| AEO with provenance | OK — `sourceType/id/field/confidence` |
| GEO claim layer | **Added** — `geo.ts` + entity/product fields |
| Arabic-first SEO templates | **Fixed** — locale-specific templates |
| Search → entity resolution | **Improved** — AR synonyms, intent, entity path in API |
| Structured data | OK — CollectionPage / FAQ / Product |
| Sitemap / robots | OK — entities in sitemap; `robots.txt/route.ts` (no conflict with `robots.ts`) |
| Hreflang | **Fixed** — `ar-SA` + `x-default` → Arabic |

## Issues found & fixed

### P0 — Critical (fixed)

1. **English-only SEO templates for Arabic pages** — `generateFromEntity` used English copy for `ar`. → Locale-specific AR templates.
2. **`x-default` hreflang pointed to English** — Saudi marketplace requires Arabic primary. → `x-default` + `ar-SA` → `/ar/...`.
3. **No GEO layer** — Generative discovery had no claim/attribution structure. → `buildProductGeo` / `buildMarketplaceGeo` + stored on entities/products.
4. **Arabic catalog matching weak** — `خوذة سلامة صناعية` / `جوالات` failed or mis-routed. → Arabic normalized index + synonym groups + aliases.
5. **Scoring English-first** — Identity required `name.en`. → Separate `seoAr/seoEn/aeoAr/aeoEn/geoAr/geoEn` + Arabic-weighted `discoveryScore`.

### P1 — High (fixed)

6. **No Arabic/mixed search intent** — Added `intent.ts` (جملة، موردين، مصنع، شراء، الرياض…).
7. **Search API did not surface marketplace entity** — Returns `entity` + `queryMeta` for landing/CTA.
8. **LLM knowledge API thin** — `/api/discovery/entity` now supports `?q=` resolution + GEO claims + bilingual scores.
9. **Canonical preferred `/en/c/`** — New entities canonicalize to `/ar/c/{slug}` (locale alternates still via hreflang).
10. **Admin lacked bilingual/GEO metrics** — Control center shows AR/EN SEO·AEO, GEO, discovery readiness.

### P2 — Medium (partial / deferred)

- Category-specific AEO question banks (construction vs food vs electronics) — base FAQs still data-driven; vertical packs deferred.
- Full synonym graph admin UI — synonyms stored on entities; admin editor deferred.
- Separate Arabic URL slug paths (`/ar/.../هواتف`) — kept stable Latin slug under `/ar/c/{slug}` for crawl safety; `slugAr` stored for display.
- Opportunity engine (Search Console import) — not built.

### P3 — Low

- Entity graph visualization in admin.
- AI referral traffic attribution.

## Database changes

- `MarketplaceEntity`: `slugAr`, `synonyms`, `geo`, bilingual score fields, `discoveryScore`
- `ProductEntity`: `geo`, synonyms, bilingual scores
- `Product`: `geo`, bilingual score fields, `discoveryScore`

## API changes

- `GET /api/discovery/entity?slug=` — full knowledge card
- `GET /api/discovery/entity?q=` — query → intent → entity resolution
- `GET /api/search` — product results include `entity` + `queryMeta`
- `GET /api/seo?resource=dashboard|entities` — GEO/discovery/AR·EN averages

## Verification commands

```bash
npm run seo:test
npm run seo:migrate   # when Mongo has products
```

Manual:

- `/ar/c/safety-equipment` — Arabic H1/meta/GEO claims
- `/en/c/safety-equipment` — English equivalent, same entity
- `/api/discovery/entity?q=جوالات&locale=ar`
- `/api/discovery/entity?q=خوذة%20سلامة%20صناعية&locale=ar`

## Remaining risks

1. Empty DB (0 products) → entities correctly **noindex**/unavailable until supply exists.
2. Existing Mongo entities seeded before this pass may still have old English-only SEO until **Recompute** / migrate refresh.
3. Mongo `$text` is weak for pure Arabic; regex + synonym keys mitigate but OpenSearch remains the long-term plan.
4. Vendor-authored HTML must stay sanitized at render (existing XSS surface — monitor).

## Go-live gate (current)

| Gate | Status |
| --- | --- |
| Persistent marketplace entity | Pass |
| Vendor ≠ entity SEO identity | Pass |
| Arabic SEO templates | Pass |
| English SEO templates | Pass |
| AEO provenance | Pass |
| GEO claims | Pass |
| LLM knowledge API | Pass |
| Faceted noindex | Pass |
| Hreflang Arabic-first | Pass |
| Thin page gate | Pass (0 supply → not indexable) |
| Admin bilingual control | Pass (metrics + recompute) |
| Category-specific AEO packs | Partial |
| Opportunity engine | Not yet |

## Non-negotiable principle compliance

**Arabic-first + English secondary** bilingual discovery from **one entity graph** feeding Search, SEO, AEO, GEO, LLM API, structured data, and internal links — implemented and extended in this remediation.
