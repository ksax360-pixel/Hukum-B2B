/**
 * Smoke checklist for Buyer procurement + Supplier growth tools.
 * Run: npx tsx scripts/smoke-procurement-tools.ts
 */
import { parseBoqText } from "../src/modules/procurement/boq-parse";
import {
  listErpConnectors,
  listEtimadFeedStub,
  punchoutHandshakeStub,
} from "../src/modules/procurement/erp-etimad";
import { normalizeQuote, recommendQuote } from "../src/lib/quote-normalize";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("=== Procurement tools smoke ===");

  const boq = parseBoqText("Item,Qty,Unit\nHelmet,100,piece\nGloves,50,box");
  assert(boq.lines.length >= 2, "BOQ parse should yield lines");
  console.log("OK BOQ parse", boq.lines.length, "lines");

  const connectors = listErpConnectors();
  assert(connectors.length === 3, "SAP/Oracle/Odoo connectors");
  const hs = punchoutHandshakeStub("sap", { items: [{ sku: "X" }] });
  assert(hs.sessionId && hs.accepted, "punchout handshake");
  console.log("OK ERP punchout stub", hs.sessionId);

  const feed = listEtimadFeedStub();
  assert(feed.length >= 1, "Etimad feed stub");
  console.log("OK Etimad feed", feed.length);

  const n1 = normalizeQuote({
    _id: "a",
    total: 1150,
    subtotal: 1000,
    tax: 150,
    currency: "SAR",
    lines: [{ quantity: 10, unitPrice: 100, total: 1000 }],
    vendorId: { legalName: { en: "A" }, verificationStatus: "verified" },
  });
  const n2 = normalizeQuote({
    _id: "b",
    total: 1200,
    subtotal: 1200,
    tax: 0,
    currency: "SAR",
    lines: [{ quantity: 10, unitPrice: 120, total: 1200 }],
    vendorId: { legalName: { en: "B" } },
  });
  const bestId = recommendQuote([n1, n2]);
  assert(bestId === "a", "recommendQuote should pick lower landed");
  console.log("OK quote normalize / compare best=", bestId, "landed", n1.landedPerUnit);

  console.log("=== All procurement smoke checks passed ===");
  console.log("Manual UI checklist:");
  console.log("  Buyer: /buyer/projects notes, /buyer/boq, RFQ invite matched, /buyer/approvals,");
  console.log("         /buyer/spend, /buyer/suppliers, /buyer/integrations, /buyer/reorders");
  console.log("  Seller: /dashboard/leads stages+WA, /dashboard/matched-leads, quote VAT+validity,");
  console.log("          /dashboard/performance, /dashboard/domain, /dashboard/catalogue-sync,");
  console.log("          /dashboard/demand-insights (radar), /dashboard/referral");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
