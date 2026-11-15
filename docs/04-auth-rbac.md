# Authentication & RBAC

## Auth methods

- Email/password (bcrypt)
- Email verification
- Mobile OTP (adapter; fails clearly if SMS not configured)
- Password reset
- Session / JWT with refresh rotation
- Ready for OAuth / SSO adapters

## Roles (seeded)

| Role | Scope |
|------|-------|
| super_admin | Full platform |
| admin | Operations |
| vendor_verification_admin | Vendor verification |
| product_admin | Product moderation |
| content_admin | CMS |
| seo_manager | SEO |
| finance_admin | Subscriptions/payments |
| support_admin | Support |
| analytics_manager | Analytics |
| ai_admin | AI config |
| buyer | Marketplace buyer |
| buyer_org_admin | Organization admin |
| vendor_owner | Vendor account owner |
| vendor_manager | Vendor ops |
| vendor_sales | RFQs/quotations |
| vendor_content | Products/content |

## Permission actions

`view | create | edit | delete | approve | reject | publish | export | manage | configure`

## Enforcement

1. API route wrappers require auth + permission.
2. Resource ownership checks (vendor can only access own products/RFQs).
3. Frontend hides controls but is not the security boundary.

## Isolation rules (tested)

- Vendor A cannot read Vendor B private data
- Buyer A cannot read Buyer B RFQs
