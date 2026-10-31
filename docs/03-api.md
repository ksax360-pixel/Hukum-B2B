# API Architecture

## Base

All routes under `/api/*`. Locale is not required on APIs; content returned bilingual.

## Standard response

```json
{
  "success": true,
  "data": {},
  "message": "",
  "error": null
}
```

## Status codes

400 validation, 401 unauthorized, 403 forbidden, 404 not found, 409 conflict, 422 business validation, 429 rate limit, 500 server error.

## Route map

| Prefix | Module |
|--------|--------|
| `/api/auth` | login, register, logout, refresh, otp, password |
| `/api/users` | profile, preferences |
| `/api/organizations` | CRUD, invites, members |
| `/api/vendors` | public list/detail, vendor self CRUD |
| `/api/buyers` | buyer profile |
| `/api/products` | catalog CRUD, bulk |
| `/api/categories` | tree CRUD |
| `/api/industries` | CRUD |
| `/api/rfqs` | create, invite, respond |
| `/api/quotations` | submit, compare |
| `/api/messages` | threads |
| `/api/documents` | upload, version |
| `/api/verification` | queues, actions |
| `/api/search` | search + filters |
| `/api/ai` | extract, translate, match, classify |
| `/api/seo` | metadata, sitemap helpers |
| `/api/analytics` | track, aggregates |
| `/api/subscriptions` | plans, current |
| `/api/payments` | checkout abstraction |
| `/api/notifications` | list, preferences |
| `/api/admin` | KPIs, settings, health |
| `/api/health` | liveness |

## Auth

Bearer session cookie + optional Authorization header. RBAC checked per resource/action.
