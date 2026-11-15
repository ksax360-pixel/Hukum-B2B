# Analytics metric definitions

Attribution default: **`createdAt` (UTC)** unless noted.

## Platform (`GET /api/admin?resource=analytics_rollup`)

Auth: `admin:view`. CORS: admin/seller panel origins.

| Metric | Definition | Source | Status rules |
|--------|------------|--------|--------------|
| totalVendors | All vendor docs | Vendor | all |
| verifiedVendors | Current verified | Vendor | verificationStatus=verified |
| pendingVendors | Current pending | Vendor | verificationStatus=pending |
| totalBuyers | Users with buyer role | User | roles contains buyer |
| publishedProducts | Current published | Product | status=published |
| pendingProducts | Moderation queue | Product | submitted\|under_review |
| activeRfqs | Open pipeline | RFQ | open\|matching\|quoted |
| new* In range | Created in filter window | respective collection | createdAt in [from,to] |
| productViews | Event count | AnalyticsEvent | type=product_view |
| vendorViews | Event count | AnalyticsEvent | vendor_view\|vendor_page_view |
| previousPeriod | Same metrics on prior equal-length window | — | omitted when compare=0 |

## Seller (`GET /api/seller-analytics`)

Auth: session with `vendorId`. **Always** scoped to `session.vendorId` (query cannot select another vendor).

| Metric | Definition |
|--------|------------|
| totalProducts / published / awaiting / rejected / draft | Product counts for vendor |
| invitations | RFQVendor rows for vendor |
| quotations | Quotation docs for vendor |
| productViews / vendorViews / contactEvents | AnalyticsEvent with vendorId |
| catalogSeries | Products created / published-created by bucket |
| opportunitySeries | Invitations + quotations by bucket |

## Not available (instrumentation gaps)

- Unique sessions / bounce
- Invitation viewed/opened
- Impression → click CTR
- Attributed win-rate conversion
- Unique storefront visitors
