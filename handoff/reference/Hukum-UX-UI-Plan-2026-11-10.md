# Hukum UX + UI improvement plan

10 Nov 2026. Builds on: the journey research (D1–D32, `Hukum-Journey-Research-2026-11-08.html`), the staging test report (58 bugs, `Hukum-Staging-Test-Report-2026-11-10.pdf`), the approved homepage, and the design rules in `handoff-20261102/DESIGN.md` (homepage tokens + unslop / hallmark floor).

Where the code lives: the public site and buyer pages are in the handoff repo (`handoff-20261102`, branch `feature/discovery-journey`). The handoff also contains `/vendor/*` and `/admin/*` pages. The live seller.hukum-ksa.com and admin.hukum-ksa.com apps are separate X360 repos we don't have, so phases B and C are built in the handoff's `/vendor` and `/admin` pages as the reference X360 copies.

## Already done on the branch (not repeated)

Natural-language search with suggestions (typos, Arabic, quantity, city) · results page with "Understood as" chips · one browse page for every menu category · supplier directory with type/city/verified filters · product decision card with consent-first contact · 3-card request form with auto-matching · supplier storefront facts · how-it-works walkthrough · normal homepage scrolling · design floor (no eyebrows, no caps labels, focus states) · admin/seller login no longer sets the public cookie.

## The buyer's job, in steps (target)

| Job | Today on staging | Target |
|---|---|---|
| Find a product | Menu pages 404 or never load; search brittle | Type anything in the header box → grouped suggestions → results with city + verified chips (3 steps) |
| Judge a supplier | Profile is a mini-site with generic claims | Card shows verified tick, city, years, products; profile shows what was checked |
| Get prices | 27-field form, matching silent, no feedback | Product page → qty + city → "Request quote" (2 steps); see which suppliers will receive it |
| Talk to a supplier | 7 competing buttons, consent hidden | One "Contact supplier": phone + consent → lead sent, number shown |
| Decide | Compare mixes requests, reject has no reason, review impossible | My requests → quotes for one request side by side → accept / reject with reason → review |

## Phase A — main site and buyer (now)

Order is by buyer impact. Each step ships in English and Arabic, at 375 px and 1440 px, with the DESIGN.md floor.

1. **Header search everywhere (D2, D3, D4).** The homepage search box (suggestions panel) moves into the header on every page, with a city chip remembered per visitor. On phones it's pinned under the header. Feedback: suggestion loading state, "no matches — send as a request" row.
2. **Feedback layer (D31 + test bugs).** One shared toast and one styled confirm dialog (Arabic-aware) replace `window.confirm`/`prompt`; skeletons for products, suppliers and results; friendly error messages; success screens that say what happens next. Fixes: native-confirm accept, silent rejects, "Vendors matched" with 0 matches.
3. **Prices and units Saudi-correct (D12, D25).** One money formatter: riyal sign, thousands separators, "includes VAT" / "+ VAT", Arabic units (قطعة, متر, طقم) on `/ar`. Hijri date beside Gregorian on validity and deadlines. Fixes "SAR 12450", raw ISO dates, "piece" on Arabic pages.
4. **Product page, second pass (D13, D14).** Sticky action bar on phones (Contact supplier · Request quote) that never covers content. "Also offered by" row: same product from other suppliers (name + category match) until X360 adds the product/offer split. Verification level line under the supplier name (D24).
5. **Request flow, second pass (D15–D18).**
   - Live "This request will reach N suppliers" preview using the matching rules, with the Hukum sourcing fallback when N = 0.
   - Quote basket: add products from cards and product pages, then send one request for all of them (up to 20 lines).
   - Draft kept in the browser so a sign-in in the middle loses nothing.
6. **Buyer workspace: My requests and quotes (D20, D21).** One page per request: status timeline (sent → matched → quotes → decision), a "nobody replied yet" nudge, and quotes for that request only, compared side by side (unit price, VAT, landed total, lead time, payment, validity). Accept / reject with an optional reason, shortlist, ask clarifying (kept after shortlisting), and a review with a 1–5 star control once the deal is closed.
7. **Homepage refinements, small (D6, D32).**
   - Hero search gets the city chip.
   - Sector tiles go to the new browse pages.
   - A "recent requests on Hukum" strip, only when the numbers are real.
   - Testimonials with real company logos get swapped for placeholders until permission exists (needs your yes).
8. **Mobile shell (D28).** Bottom bar: Home, Categories, Request quotes (centre), Messages, Account. Active state. Hidden when the keyboard is open.

Acceptance for phase A: a new buyer can go from the homepage to a sent request in 4 taps on a phone; every action gives visible feedback within 300 ms; no English left on `/ar` key paths; zero horizontal scroll at 375 px.

## Phase B — supplier side (`/vendor/*` reference build)

1. **Sign-up and verification wizard (D29).** Phone and CR first; progress meter; save after each step; document checklist up front (CR, VAT certificate, national address); CR 10-digit and VAT 15-digit checks; status page that says exactly what's missing.
2. **Catalogue onboarding (D30).** One import screen for CSV / XLSX / PDF text, with every extracted row shown in an editable table. Invented values are flagged and empty fields stay empty. Category picked from the real taxonomy. Row errors are blocking and counted.
3. **Leads and requests inbox.** Invites with Accept / Decline that work; one quote form with VAT and payment terms fields; quote locked once accepted.
4. **Seller dashboard.** Today's leads, quotes waiting, listings needing fixes, verification state, one primary action.

## Phase C — admin (`/admin/*` reference build)

1. **Verification workspace.** The uploaded document is shown next to the profile's CR, VAT and name, with mismatch warnings, a reason required on reject, and a working Suspend / Reinstate.
2. **Moderation.** Product reject needs a reason, which is sent to the seller; edits to live products show as a diff against the approved version.
3. **Responsive tables** (cards under 1000 px) and consistent dialogs.

## Decisions I'll take by default (say if you disagree)

- **Arabic default (D1):** keep English as default for now, since you said "English first, then Arabic"; every new screen ships in both.
- **Login:** still parked; the request draft survives sign-in so nothing is lost when it lands.
- **Testimonials with real logos:** I'll swap them for placeholders only if you say yes.

## How each step is checked

- Browser check in English and Arabic, at 375 px and 1440 px.
- The design floor from DESIGN.md.
- No console errors.
- Committed on `feature/discovery-journey` with a one-line summary.
