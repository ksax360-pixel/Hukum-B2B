# Kingdom Trade — File uploads

Domain API: `Frontend` (`POST /api/uploads`, `GET /api/media`).

Uses **multer** (diskStorage config in `src/lib/multer-config.ts`) with the same folder layout written by the Next.js FormData handler.

## Layout

```
uploads/
  private/documents/{vendorId}/{docType}/     # CR, VAT — Document ACL
  public/products/{company-slug-id}/{productId}/
  public/companies/{company-slug-id}/logo/
  public/companies/{company-slug-id}/cover/
  public/categories/{categoryId}/
```

## Auth

| kind | Who |
|------|-----|
| document, product, company_logo, company_cover | Seller (own vendor) or admin |
| category | Admin only |

Private docs → `Document` + `local:` ref + download via `/api/documents?id=&download=1`  
Public images → `/api/media?path=public/...`
