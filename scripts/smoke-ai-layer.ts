/**
 * End-to-end smoke for Hukum AI layer (9 capabilities + governance).
 */
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { getAiCapabilityScorecard } from "../src/modules/ai/capabilities";
import { minimizePii } from "../src/modules/ai/pii-minimize";
import { checkCostCap, estimateCostUsd, recordSpend } from "../src/modules/ai/cost-caps";
import { gatewayStatus } from "../src/modules/ai/gateway";
import { precheckVendorDocument } from "../src/modules/ai/doc-precheck";
import { matchVendorsForRfq } from "../src/modules/rfqs/matching.service";
import { buildDemandInsights } from "../src/modules/ai/demand-insights";
import { normalizeQuote, recommendQuote } from "../src/lib/quote-normalize";
import { runQuoteAgent } from "../src/modules/ai/quote-agent";
import { searchCatalogProducts } from "../src/modules/products/catalog-search";
import { runCompareAgent } from "../src/modules/ai/compare-agent";

async function main() {
  const results: Array<{ name: string; ok: boolean; detail?: string }> = [];

  const pii = minimizePii("Email me at buyer@acme.sa or call +966501234567 CR 1010123456");
  results.push({
    name: "governance.pii_minimize",
    ok: pii.redactions >= 2 && !pii.text.includes("@") && !pii.text.includes("501234567"),
    detail: `${pii.redactions} redactions → ${pii.text}`,
  });
  const cap = checkCostCap({ userId: "smoke", feature: "search" });
  recordSpend({
    userId: "smoke",
    feature: "search",
    costUsd: estimateCostUsd({ promptTokens: 1000, completionTokens: 500 }),
  });
  results.push({
    name: "governance.cost_caps",
    ok: cap.ok,
    detail: gatewayStatus().configured ? "model on" : "model off (fallback OK)",
  });

  const pre = precheckVendorDocument({
    type: "vat",
    fileName: "vat.pdf",
    mimeType: "application/pdf",
    sizeBytes: 120_000,
    numberHint: "300000000000003",
    ocrText: "VAT Certificate 300000000000003 Company Acme Trading exp 2027-01-01",
    declared: { vatNumber: "300000000000099", legalName: "Other Co" },
  });
  results.push({
    name: "verification_precheck",
    ok: pre.humanDecisionRequired === true && pre.mismatches.length > 0 && !!pre.extracted.vatNumber,
    detail: `score=${pre.score} mismatches=${pre.mismatches.length} extracted=${pre.extracted.vatNumber}`,
  });

  const draft = await runQuoteAgent({
    role: "seller",
    message: "Draft a quote for 100 helmets",
    locale: "en",
    context: { quantity: 100, targetPrice: 45 },
  });
  results.push({
    name: "quote_assistant",
    ok: Boolean(draft.draft) && (draft.source === "heuristic" || draft.source === "ai"),
    detail: `source=${draft.source} hasDraft=${!!draft.draft}`,
  });

  const n1 = normalizeQuote({
    _id: "q1",
    total: 1150,
    currency: "SAR",
    lines: [{ quantity: 10, unitPrice: 100, total: 1000 }],
    tax: 150,
    shipping: 0,
    validity: new Date(Date.now() + 7 * 86400000).toISOString(),
    leadTime: "14 days",
    vatIncluded: true,
  });
  const n2 = normalizeQuote({
    _id: "q2",
    total: 900,
    currency: "SAR",
    lines: [{ quantity: 10, unitPrice: 80, total: 800 }],
    tax: 0,
    shipping: 50,
    leadTime: "21 days",
  });
  const recId = recommendQuote([n1, n2]);
  results.push({
    name: "quote_normaliser",
    ok: n1.landedPerUnit > 0 && typeof recId === "string",
    detail: `landed=${n1.landedPerUnit} rec=${recId}`,
  });

  await connectDB();
  // Register populate models used by catalog search
  await import("../src/modules/categories/taxonomy.model");
  await import("../src/modules/vendors/vendor.model");
  await import("../src/modules/products/product.model");

  const search = await searchCatalogProducts({ q: "safety", limit: 5, page: 1 });
  results.push({
    name: "ai_search",
    ok: Array.isArray(search.items),
    detail: `live hits=${(search.items || []).length}`,
  });

  const matches = await matchVendorsForRfq({ city: "Riyadh", textHints: ["safety"] });
  results.push({
    name: "lead_matching",
    ok: Array.isArray(matches),
    detail: `candidates=${matches.length}`,
  });

  const demand = await buildDemandInsights({ days: 30 });
  results.push({
    name: "demand_insights",
    ok: demand.anonymized === true && Array.isArray(demand.topSearches),
    detail: `searches=${demand.totals.searches} alerts=${demand.priceAlerts.length}`,
  });

  const cmp = runCompareAgent(
    [
      { id: "1", name: "Helmet A", priceLabel: "40 SAR", city: "Riyadh", verified: true },
      { id: "2", name: "Helmet B", priceLabel: "55 SAR", city: "Jeddah", verified: false },
      { id: "3", name: "Helmet C", priceLabel: "42 SAR", city: "Riyadh", verified: true },
    ],
    "safety helmets Riyadh",
    "en"
  );
  results.push({
    name: "compare_recommend",
    ok: Boolean(cmp.reply && cmp.bestId),
    detail: `best=${cmp.bestId} source=${cmp.source}`,
  });

  const card = getAiCapabilityScorecard();
  results.push({
    name: "scorecard",
    ok: card.overallPercent >= 70,
    detail: `overall=${card.overallPercent}% capabilities=${card.capabilities.length}`,
  });

  console.log("\n=== Hukum AI layer smoke ===\n");
  for (const r of results) {
    console.log(`${r.ok ? "✅" : "❌"} ${r.name}: ${r.detail || ""}`);
  }
  console.log("\n--- Scorecard ---");
  console.log(`OVERALL: ${card.overallPercent}%`);
  for (const c of card.capabilities) {
    console.log(`  ${c.percent}%  [${c.phase}] ${c.name} (${c.audience}) — ${c.status}`);
  }
  console.log("\nGateway:", card.gateway);

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error("\nFailed:", failed.map((f) => f.name));
    process.exitCode = 1;
  } else {
    console.log("\n✅ All AI layer checks passed");
  }

  await mongoose.disconnect().catch(() => undefined);
}

main().catch(async (e) => {
  console.error("❌", e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
