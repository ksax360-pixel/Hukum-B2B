# Kingdom Trade — Architecture

## Overview

Kingdom Trade is a Saudi-focused, AI-powered B2B marketplace and procurement ecosystem. The initial delivery is a **modular monolithic Next.js application** with clear domain boundaries so modules can later become microservices.

## Application layout

```
kingdom-trade/
  src/
    app/                 # Next.js App Router (locale-prefixed)
    components/          # Shared UI (design system)
    modules/             # Domain modules (future service seams)
    services/            # Business logic
    repositories/        # Data access (Mongoose)
    validators/          # Zod schemas
    lib/                 # Shared utilities (db, auth, api)
    hooks/
    config/
    i18n/
```

## Domain modules

| Module | Responsibility | Future service |
|--------|----------------|----------------|
| auth | Sessions, OTP, tokens | Auth Service |
| users | Profiles, preferences | User Service |
| organizations | Buyer orgs, invites | Organization Service |
| vendors | Profiles, microsites, onboarding | Vendor Service |
| buyers | Buyer profiles | Buyer Service |
| products | Catalog, variants, completeness | Product Service |
| categories | Taxonomy tree | Category Service |
| industries | Industry taxonomy | Category Service |
| rfqs | RFQ lifecycle | RFQ Service |
| quotations | Quotes + comparison | Quotation Service |
| messages | Buyer↔vendor threads | Communication Service |
| documents | Uploads, versioning | Document Service |
| verification | Vendor/product workflows | Verification Service |
| ai | Extraction, translation, matching | AI Service |
| search | Search abstraction | Search Service |
| seo | Metadata, sitemaps | SEO Service |
| analytics | Events, dashboards | Analytics Service |
| subscriptions | Plans, limits | Subscription Service |
| payments | Payment abstraction | Payment Service |
| notifications | Email/SMS/in-app | Notification Service |
| admin | Ops surfaces | Admin BFF |

## Layering rules

1. UI components never talk to MongoDB directly.
2. Route handlers call services; services call repositories.
3. RBAC is enforced in API middleware / service guards.
4. AI/search/queue/payment integrations use adapter interfaces.

## Request flow

```
Client → Route Handler → Auth/RBAC → Service → Repository → MongoDB
                              ↓
                    AI / Search / Queue adapters
```

## Bilingual / RTL

- Routes: `/en/...` and `/ar/...`
- Commercial fields: `{ en, ar }`
- Arabic = RTL; English = LTR
- Fonts: Mulish (EN), Tajawal (AR)

## Design system

- Light-first UI: white / mist neutrals, ink `#071d27`, accent red `#D21F1F`
- Public chrome adapted from design ref `2` (glass header, spacing)
- Admin chrome adapted from design ref `1` (sidebar, theme, metrics)
