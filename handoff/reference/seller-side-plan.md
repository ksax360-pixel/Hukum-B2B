# Supplier side: UX/UI plan (11 Nov 2026)

Sources: investor deck (Free, Gold, Premium; buyers always free), CEO handbook (paid plans from Jan 2028, report RFQs as enquiries), platform journey map (supplier journey: register, verify, storefront, get leads, quote and win, upgrade, grow) and Khalid's walkthrough notes.

Rules for every supplier screen:
- No plan prices anywhere. Year one is free; plans are described by what they add, never by price.
- Requests are enquiries, never "deals" or "revenue".
- Same design floor as the buyer side: sentence case, tokens, one primary action per block, mobile first, Arabic and English.

## Public pages
1. How it works for suppliers (new): register, verify, storefront, receive requests, quote, win. Same style as How it works for buyers, linked from the How it works menu.
2. Become a supplier: done. Keep pricing out.
3. Supplier microsite: done (own header, hero, footer).

## Supplier portal
| # | Screen | Today | Change |
|---|---|---|---|
| S1 | Home | Generic widgets, 3D cube, gauge | Requests first: new requests to quote, quotes waiting on buyers, profile checklist with progress, storefront link and share |
| S2 | Requests and quote builder | Bare list, no detail | Request cards with items, quantity, city, needed by; open one to see lines and send a quote (unit price per line, lead time, payment terms, validity, VAT shown) |
| S3 | Quotes sent | Table | Status per quote: submitted, buyer asked a question, shortlisted, accepted, declined |
| S4 | Company and storefront | Unlabelled inputs | Labelled sections: identity, contact, about, cities served, certifications; storefront look (logo, banner, colour, headline); preview link |
| S5 | Verification and documents | "When enabled" empty state | Trust ladder with what is needed for each level and upload slots |
| S6 | Plan | Prices | "Free in 2027": what is included now, what paid plans will add later, no prices |
| S7 | Products | Name-only form | Catalogue table with search, status and completeness; add product, bulk upload, AI catalogue |
| S8 | Analytics | Mixed | Views, contact reveals, requests received, response time, all labelled as enquiries |

Order: S6, public page, S1, S2, S3, S4, S5, S7, S8. Then the admin side.
