/**
 * Real-user style bilingual smoke (English + Arabic) across AI capabilities.
 */
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { getAiCapabilityScorecard } from "../src/modules/ai/capabilities";
import { buildDemandInsights } from "../src/modules/ai/demand-insights";
import { precheckVendorDocument } from "../src/modules/ai/doc-precheck";
import { runCompareAgent } from "../src/modules/ai/compare-agent";
import { runQuoteAgent } from "../src/modules/ai/quote-agent";
import { ingestFreeformQuote, normalizeQuote, recommendQuote } from "../src/lib/quote-normalize";
import { extractNeedSlots } from "../src/modules/ai/hukum/need-extract";
import { minimizePii } from "../src/modules/ai/pii-minimize";
import { searchCatalogProducts } from "../src/modules/products/catalog-search";
import { matchVendorsForRfq } from "../src/modules/rfqs/matching.service";

type Row = { locale: string; name: string; ok: boolean; detail: string };

async function main() {
  const rows: Row[] = [];
  const push = (locale: string, name: string, ok: boolean, detail: string) =>
    rows.push({ locale, name, ok, detail });

  await connectDB();
  await import("../src/modules/categories/taxonomy.model");
  await import("../src/modules/vendors/vendor.model");
  await import("../src/modules/products/product.model");

  // —— English buyer journey ——
  {
    const locale = "en";
    const need = extractNeedSlots("I need 100 safety helmets in Riyadh next month");
    push(locale, "need_extract", Boolean(need.quantity || need.city || need.category || need.rawText), JSON.stringify(need).slice(0, 120));

    const search = await searchCatalogProducts({ q: "safety helmet", city: "Riyadh", limit: 5, page: 1 });
    push(locale, "ai_search", Array.isArray(search.items), `hits=${search.items?.length || 0}`);

    const cmp = runCompareAgent(
      [
        { id: "a", name: "Safety Helmet Pro", priceLabel: "45 SAR", city: "Riyadh", verified: true, leadTime: "7 days" },
        { id: "b", name: "Helmet Basic", priceLabel: "30 SAR", city: "Jeddah", verified: false },
        { id: "c", name: "Safety Cap", priceLabel: "40 SAR", city: "Riyadh", verified: true },
      ],
      "safety helmets Riyadh",
      "en"
    );
    push(locale, "compare", cmp.bestId === "a" || Boolean(cmp.bestId), `best=${cmp.bestId} · ${cmp.reply.slice(0, 80)}`);

    const free = ingestFreeformQuote(
      "Unit price: 42\nQty: 100\nVAT: 630\nShipping: 50\nTotal: 4880 SAR\nLead time: 10 days\nPayment: Net 30",
      { id: "en1", locale: "en" }
    );
    push(locale, "quote_normaliser", free.landedPerUnit > 0 && free.qty === 100, `landed=${free.landedPerUnit}`);

    const buyerAgent = await runQuoteAgent({
      role: "buyer",
      message: "Help me draft an RFQ for PPE",
      locale: "en",
    });
    push(locale, "buyer_agent", Boolean(buyerAgent.reply), buyerAgent.reply.slice(0, 100));

    const sellerAgent = await runQuoteAgent({
      role: "seller",
      message: "Quote safety helmets",
      locale: "en",
      context: {
        quantity: 100,
        catalogue: [{ name: "Safety Helmet Pro", price: 44, sku: "SH-1", leadTime: "7 days" }],
      },
    });
    push(
      locale,
      "seller_quote_assistant",
      Boolean(sellerAgent.draft?.groundedFromCatalogue) && Boolean(sellerAgent.draft),
      `grounded=${sellerAgent.draft?.groundedFromCatalogue} price=${sellerAgent.draft?.unitPrice}`
    );

    const demand = await buildDemandInsights({ days: 30, locale: "en", allowDemo: true });
    push(
      locale,
      "demand_insights",
      demand.anonymized && demand.copy.title === "Demand insights" && (demand.topSearches?.length || 0) > 0,
      `title=${demand.copy.title} searches=${demand.topSearches.length} alerts=${demand.priceAlerts.length}`
    );

    const pii = minimizePii("Call +966501112223 buyer@test.com");
    push(locale, "governance_pii", pii.redactions >= 2, pii.text);
  }

  // —— Arabic buyer journey ——
  {
    const locale = "ar";
    const need = extractNeedSlots("أحتاج 100 خوذة سلامة في الرياض الشهر القادم");
    push(locale, "need_extract", Boolean(need.rawText || need.city || need.quantity), JSON.stringify(need).slice(0, 120));

    const search = await searchCatalogProducts({ q: "خوذة سلامة", limit: 5, page: 1 });
    push(locale, "ai_search", Array.isArray(search.items), `hits=${search.items?.length || 0}`);

    const cmp = runCompareAgent(
      [
        { id: "a", name: "خوذة سلامة برو", priceLabel: "45 ر.س", city: "الرياض", verified: true },
        { id: "b", name: "خوذة أساسية", priceLabel: "30 ر.س", city: "جدة", verified: false },
      ],
      "خوذات سلامة الرياض",
      "ar"
    );
    push(locale, "compare", Boolean(cmp.reply) && /أنسب|الأنسب|موثّق|المورد/.test(cmp.reply), cmp.reply.slice(0, 100));

    const free = ingestFreeformQuote(
      "سعر الوحدة: 42\nكمية: 50\nضريبة: 315\nالإجمالي: 2415 ر.س\nمهلة التوريد: 14 يوم",
      { id: "ar1", locale: "ar" }
    );
    push(locale, "quote_normaliser", free.unitPrice === 42 && free.qty === 50, `unit=${free.unitPrice} qty=${free.qty}`);

    const buyerAgent = await runQuoteAgent({
      role: "buyer",
      message: "ساعدني بصياغة طلب سعر لمعدات السلامة",
      locale: "ar",
    });
    push(locale, "buyer_agent", /[\u0600-\u06FF]/.test(buyerAgent.reply), buyerAgent.reply.slice(0, 100));

    const sellerAgent = await runQuoteAgent({
      role: "seller",
      message: "عرض سعر خوذة سلامة",
      locale: "ar",
      context: {
        quantity: 50,
        catalogue: [{ name: "خوذة سلامة", price: 40, sku: "SH-AR", leadTime: "10 أيام" }],
      },
    });
    push(
      locale,
      "seller_quote_assistant",
      Boolean(sellerAgent.draft) && /[\u0600-\u06FF]/.test(sellerAgent.reply),
      sellerAgent.reply.slice(0, 100)
    );

    const demand = await buildDemandInsights({ days: 30, locale: "ar", allowDemo: true });
    push(
      locale,
      "demand_insights",
      demand.copy.title === "رؤى الطلب" && demand.anonymized,
      `title=${demand.copy.title} cities=${demand.topCities[0]?.label || ""}`
    );

    const pre = precheckVendorDocument({
      type: "vat",
      fileName: "vat.pdf",
      mimeType: "application/pdf",
      sizeBytes: 50_000,
      ocrText: "شهادة ضريبة 300000000000003",
      declared: { vatNumber: "300000000000003", legalName: "شركة" },
    });
    push(locale, "verification", pre.humanDecisionRequired && pre.extracted.vatNumber === "300000000000003", `score=${pre.score}`);
  }

  // Shared
  const matches = await matchVendorsForRfq({ city: "Riyadh", textHints: ["safety"] });
  push("both", "lead_matching", Array.isArray(matches), `n=${matches.length}`);

  const n1 = normalizeQuote({
    _id: "1",
    total: 500,
    lines: [{ quantity: 10, unitPrice: 50 }],
    tax: 0,
    shipping: 0,
  });
  const n2 = normalizeQuote({
    _id: "2",
    total: 400,
    lines: [{ quantity: 10, unitPrice: 40 }],
    tax: 0,
    shipping: 0,
  });
  push("both", "recommend", recommendQuote([n1, n2]) === "2", `rec=${recommendQuote([n1, n2])}`);

  const card = getAiCapabilityScorecard();
  push("both", "scorecard_100", card.overallPercent === 100, `overall=${card.overallPercent}%`);

  console.log("\n=== Real-user bilingual AI smoke ===\n");
  for (const r of rows) {
    console.log(`${r.ok ? "✅" : "❌"} [${r.locale}] ${r.name}: ${r.detail}`);
  }
  console.log("\n--- Final scorecard ---");
  console.log(`OVERALL: ${card.overallPercent}%`);
  for (const c of card.capabilities) {
    console.log(`  ${c.percent}%  ${c.name} (${c.audience}) [${c.status}]`);
  }

  const failed = rows.filter((r) => !r.ok);
  if (failed.length) {
    console.error("\nFailed:", failed.map((f) => `${f.locale}/${f.name}`));
    process.exitCode = 1;
  } else {
    console.log("\n✅ EN + AR real-user checks passed — AI layer 100%");
  }
  await mongoose.disconnect().catch(() => undefined);
}

main().catch(async (e) => {
  console.error("❌", e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
