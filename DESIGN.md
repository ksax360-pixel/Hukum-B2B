# Hukum design rules (public site)

Derived 2026-11-10 from the approved homepage, with the floor rules of
[unslop](https://github.com/heydamir/unslop) (CC BY 4.0, Damir Sokolovsky) and
[hallmark](https://github.com/nutlope/hallmark).

## Direction

- **Product.** Saudi B2B marketplace: buyers find a product or supplier, then send one request or contact the supplier directly.
- **Character.** Exact, unhurried, trustworthy.
- **World.** A trade counter and a warehouse floor: real products on light grey, green for "verified / go".
- **Moments.** Product photos and renders on `--hukum-ivory` tiles; the price/MOQ/lead-time figures on cards and the product page.
- **Signature.** The green verified tick next to a supplier name, and the supplier city on every product card.

## Tokens

Use `src/styles/hukum-system.css` only (`--hukum-green`, `--hukum-ink`, `--hukum-muted`, `--hukum-ivory`, `--hukum-border*`, radius and shadow tokens). No literal colours in new CSS except tints of these.

## Floor (never ship)

1. No eyebrow labels above headings; no ALL-CAPS tracked labels. Sentence case everywhere.
2. No "·"-joined meta strings; use separate elements with a gap.
3. Font weights 400 to 600. Figures use `font-variant-numeric: tabular-nums`.
4. One primary action per block (green pill); one secondary (outline). No third button.
5. Every control has a visible `:focus-visible` outline; motion has a `prefers-reduced-motion` fallback; never `transition: all`.
6. No invented numbers, testimonials or logos. Demo data is marked demo.
7. No full stop on headings, labels, buttons. No hype words ("seamless", "AI-powered" on everything).
8. Spacing on a 4px grid (2px steps only inside small controls).
9. Copy: no quote-time promises; contact goes through the Hukum relay and every reveal is logged.

## Patterns

- **Product card:** `PopularProductCard` via `toCardItem()` everywhere (photo, name, supplier + city, MOQ, price, lead time, Request quote).
- **Browse pages:** `src/components/browse/BrowsePage.tsx` (products first, city / verified chips, suppliers rail, request fallback).
- **Supplier list:** `src/components/vendors/VendorDirectory.tsx`.
- **Product decision card:** `.pdp-deal` in `ProductDetailMarketplace.tsx` (Contact supplier = consent + lead + number reveal; quote form with qty + city).
- **Request form:** `src/app/[locale]/rfq/page.tsx` (`.rfq2`), three cards plus collapsed extras.
