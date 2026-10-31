/**
 * Smoke: roles dashboards coverage checklist (Buyer / Supplier / Admin).
 */
import { BUYER_NAV } from "../src/lib/buyer-nav";
import { ADMIN_NAV } from "../src/lib/admin-nav";
import { existsSync } from "fs";
import { join } from "path";

const root = "/root/Hijra-B2b";

function buyerPage(href: string) {
  // /buyer/dashboard -> Frontend/src/app/[locale]/buyer/dashboard/page.tsx
  const slug = href.replace(/^\/buyer\/?/, "") || "dashboard";
  return join(root, "Frontend/src/app/[locale]/buyer", slug, "page.tsx");
}

function adminPage(href: string) {
  const slug = href.replace(/^\/admin\/?/, "") || "";
  if (!slug) return join(root, "Frontend/src/app/[locale]/admin/page.tsx");
  return join(root, "Frontend/src/app/[locale]/admin", slug, "page.tsx");
}

const sellerPages = [
  "/dashboard/storefront",
  "/dashboard/products",
  "/dashboard/products/ai-catalogue",
  "/dashboard/leads",
  "/dashboard/quotations",
  "/dashboard/quotations/templates",
  "/dashboard/analytics",
  "/dashboard/viewers",
  "/dashboard/verification",
  "/dashboard/billing",
  "/dashboard/pricing",
  "/dashboard/demand-insights",
  "/dashboard/inbox",
];

function sellerFile(href: string) {
  const slug = href.replace(/^\/dashboard\/?/, "") || "page";
  if (!slug || slug === "page") return join(root, "seller-admin/src/app/dashboard/page.jsx");
  return join(root, "seller-admin/src/app/dashboard", slug, "page.jsx");
}

const buyerSpec = [
  "Saved suppliers & products → /buyer/saved",
  "AI assistant & inbox → /buyer/messages",
  "Sourcing projects & shortlists → /buyer/projects",
  "Quotes compare/accept/decline → /buyer/quotations",
  "RFQ history → /buyer/rfqs",
  "Reorders & reminders → /buyer/reorders",
  "Company team → /buyer/organization",
  "Spend analytics → /buyer/spend",
  "Profile / privacy export → /buyer/privacy + /buyer/settings",
];

const adminSpec = [
  "Verification queue → /admin/vendors",
  "Listing moderation & reports → /admin/products + /admin/reports",
  "Users roles → /admin/users",
  "AI oversight → /admin/hukum",
  "Leads quotes concierge → /admin/rfqs + /admin/tickets",
  "KPI funnel → /admin/analytics",
  "Subscriptions → /admin/revenue",
  "AI & WA costs → /admin/costs",
  "Feature flags / CMS / demo → /admin/feature-flags + /admin/content",
];

let ok = 0;
let fail = 0;

console.log("\n=== Roles dashboards smoke ===\n");
console.log("BUYER_NAV items:", BUYER_NAV.length);
for (const item of BUYER_NAV) {
  const f = buyerPage(item.href);
  const exists = existsSync(f);
  console.log(`${exists ? "✅" : "❌"} buyer ${item.href}`);
  if (exists) ok++;
  else fail++;
}

console.log("\nSELLER pages:");
for (const href of sellerPages) {
  const f = sellerFile(href);
  const exists = existsSync(f);
  console.log(`${exists ? "✅" : "❌"} seller ${href}`);
  if (exists) ok++;
  else {
    fail++;
    console.log("   missing", f);
  }
}

console.log("\nADMIN_NAV items:", ADMIN_NAV.length);
for (const item of ADMIN_NAV) {
  const f = adminPage(item.href);
  const exists = existsSync(f);
  console.log(`${exists ? "✅" : "❌"} admin ${item.href}`);
  if (exists) ok++;
  else {
    fail++;
    console.log("   missing", f);
  }
}

console.log("\n--- Spec coverage ---");
buyerSpec.forEach((s) => console.log("·", s));
adminSpec.forEach((s) => console.log("·", s));

const total = ok + fail;
const pct = Math.round((ok / total) * 100);
console.log(`\nPages present: ${ok}/${total} (${pct}%)`);
if (fail) process.exitCode = 1;
else console.log("✅ All role dashboard pages present");
