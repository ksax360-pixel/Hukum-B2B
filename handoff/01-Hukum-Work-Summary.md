# Hukum: what we changed, and why

12 November 2026, prepared for the X360 team.

## 1. Where things are

- **Live site:** https://hukum-vercel.vercel.app (Vercel project `hukum-vercel`, in English and Arabic).
- **Code:** this folder, in `02-source/`. It is built on the X360 handoff of 2 Nov 2026, on branch `feature/discovery-journey`, with 66 commits on top of the handoff baseline.
- **Database:** preview and production share one MongoDB. It holds demo data only: 102 products, and 8 extra suppliers marked "(Demo)".
- **Demo sign-ins:** admin, buyer and supplier. The accounts and passwords are in `scripts/seed.ts`.

## 2. The logic behind every decision

Hukum is a **lead-gen marketplace**. A buyer **requests** a price, Hukum **matches** suppliers, and the buyer **compares** the quotes. The moment that makes money is a buyer asking for a price or a contact, so every screen is built to get there in as few clicks as possible.

Five rules held throughout:

1. **One main action per screen.** Earlier, the product page had 7 buttons competing for attention. Now there is one primary action and, at most, one secondary.
2. **Honest by default.** We removed or don't use:
   - fake "Verified" badges or testimonials;
   - invented numbers;
   - timing promises, except the approved one: "3 or more verified quotes, in days, not weeks".
   - We say "orders" and "enquiries", never "deals".
   - Supplier contact goes through Hukum and is shared only after the buyer accepts a quote.
3. **Bilingual and mobile first.** Every page works in Arabic (right to left) and English, at phone width. It uses the new Saudi Riyal sign and Saudi number and unit formats.
4. **Fewer, clearer pages.** We cut instead of adding:
   - the buyer menu went from 19 items to 9;
   - the admin menu went from 24 to 15;
   - pages that were cut now redirect to the page that does that job.
5. **Secure at the API, not just in the UI.** Whenever a screen depended on an API that leaked data or trusted the client, we fixed the API (see section 4).

## 3. What changed, area by area

| Area | What we did | Why |
|---|---|---|
| **Search** | Natural-language search: "Understood as" chips, suggestions in the header on every page, and search terms carried into the request form. | Buyers type "500 bags cement Riyadh", not category names. |
| **Results and browse** | One browse layout for categories, sectors and products. The same item from several suppliers is grouped into one "Compare N offers" card. Grid and list views, and a sort by lowest price. Fixed the header industry links that went to "Not found". | Comparing suppliers is the core value, so it should show up already in the results. |
| **Product page** | A buying panel, a table comparing suppliers, a details section and a supplier card. "Request quotes" is the main action and Contact is the secondary one. Action bar fixed to the bottom on phones. | It replaces 7 competing buttons with one clear path. |
| **Request for quotes (RFQ)** | A short form that takes several items at once, with paste-a-list and an Excel/CSV bill of quantities upload. It shows which suppliers the request will reach and keeps a draft through sign-in. After sending, a page shows the next steps. Matching now falls back to item names. | Before this, a typed request with no category matched 0 suppliers and gave no message. |
| **Buyer workspace** | 9 jobs: Home, Requests, Quotes, Messages, Saved, Suppliers, BOQ upload, Settings, Help. Requests show their progress (sent → reached suppliers → quotes in → chosen). Quotes compare line by line, with working accept, decline and ask-a-question. | The old workspace had 19 menu items, most of them empty or not connected to anything. |
| **Supplier workspace** | The home opens on one priority panel: waiting requests, wins, or "add your products". Also: a requests inbox with a line-by-line quote builder; quotes sent; a storefront editor with live preview, where changes go to review first; products with a photo upload editor; a verification ladder (Registered → Verified via Wathq/ZATCA → Verified Pro); analytics; catalogue import; messages; help; settings. A won quote shows the buyer's contact. | Suppliers live in their inbox, so they need to see what to answer first and how to win it. |
| **Supplier sign-up** | Asks for company name, what you sell, city and sales mobile, then shows the next 3 steps and lands on a first-run home. | Matching needs to know what a supplier sells and where. |
| **Admin** | A "Today" home listing what needs a person (verification, storefront changes, listings, reports, support, unmatched requests, requests with no quotes) plus a 7-day pulse. Also a verification queue with CR and VAT numbers, and storefront review. Staff only. | Admin is a work queue, not a wall of charts. |
| **Public pages** | Home cleaned up: snap-scroll and fake testimonials removed, a "How it works" animation, a closing call to action. Rebuilt or new: about, contact, FAQ (18 answers), help centre (buying and selling paths), verification, become a supplier, suppliers by city, brands, VIP sourcing help, report a concern. | Every page answers one question and links to the next step. |
| **Legal** | Terms, privacy and marketplace rules on one layout, each with a plain-language summary, in English and Arabic. | They match the real model: free for suppliers through 2027, contact via relay, verification steps. |
| **Shared UI** | Our own confirm dialog and notifications (instead of the browser's pop-ups), Saudi money and unit formatting, Arabic city names, sentence-case labels, no sideways scroll. Rules are written up in `DESIGN.md`. | One consistent system instead of a different style on each page. |

## 4. Security holes fixed in the frontend (X360: please apply the same fixes to the main backend)

1. **Supplier profile update:** suppliers could set their own verification, featured status or published storefront. Fixed: only an allowed list of fields can be changed (`src/lib/vendor-edit.ts`).
2. **Products:**
   - create and update accepted any `vendorId` or status;
   - drafts and rejected products could be seen publicly;
   - edits to a live product went live without review;
   - supplier contact details leaked through linked data.
3. **Quotes:**
   - the quotes list returned every quote to anyone;
   - invited suppliers could read rival quotes and the buyer's contact details.
4. **Other APIs:**
   - support tickets returned everyone's tickets;
   - changing a request's status had no owner check;
   - saved items leaked supplier contact details;
   - "start conversation" trusted the participant list sent by the client.
5. **Accounts and access:**
   - public sign-up could create admin accounts;
   - anyone could open the admin and supplier workspaces;
   - admin and seller sign-ins set the public site's session cookie;
   - the category search pattern could be abused to slow the server (ReDoS).

Earlier staging tests (report in `03-reference/`) also found these on the main backend:
- the forgot-password API returns the reset token, so rotate the admin and buyer tokens;
- signing out doesn't revoke tokens;
- suspended users keep access;
- the AI document check passes fakes;
- the AI catalogue invents prices.

## 5. APIs the frontend expects but the handoff doesn't have (X360 owns these)

- **Contact and interest:** contact-reveal, product-interest.
- **Account data:** organizations, privacy, notifications matrix.
- **Supplier business:** seller-analytics, monetisation.
- **AI:** ai/chat, ai/compare.
- **Other:** risk, procurement integrations.
- **Sign-in:** OTP and SSO. These are hidden behind `NEXT_PUBLIC_AUTH_OTP` and `NEXT_PUBLIC_AUTH_SSO` until the backend exists.

## 6. Still open

1. **File storage:** `/api/uploads` writes to local disk, which doesn't persist on Vercel. Move it to Vercel Blob or S3 (see `docs/UPLOADS.md`).
2. **WhatsApp:** the business number is needed. WhatsApp buttons stay hidden until `SITE_CONTACT.whatsapp` is set.
3. **Real data:** demo suppliers and products are labelled "(Demo)" and none is marked Verified. Remove them before launch: they are tagged `demo-batch-2026-11`.
4. **TypeScript errors:** the build skips them (`ignoreBuildErrors: true`). Clean them up, then turn the check back on.
5. **Backend:** merge the section 4 fixes into the main backend.

## 7. How to run and deploy

```bash
npm install
npx tsx scripts/dev-mongo-27019.ts   # local in-memory MongoDB on port 27019
npm run seed                         # base demo data
npx tsx scripts/seed-demo-batch.ts   # 8 demo suppliers, 36 products with photos
npx next dev -p 3002
```

- **Environment variables:** `MONGODB_URI` and `AUTH_SECRET`. See `.env.example`.
- **Deploy:** `vercel deploy --prod`. `.vercelignore` keeps env files and local uploads out.
- **Checks:** run `npx tsx scripts/checks/*.check.ts`. There are 7 checks and all pass.

**Tested before handover:**
- 54 pages × desktop and mobile × 4 roles: no errors;
- the full journey: buyer request → 7 suppliers matched → supplier quote → buyer accepts → contacts shared both ways → supplier sees "You won";
- admin: verify a supplier, approve a storefront, and keep buyers out of admin;
- production build: 212 pages.
