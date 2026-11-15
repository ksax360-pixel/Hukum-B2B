import { matchCatalogFromText, findCatalogBySlug } from "../src/modules/seo/catalog-resolve";
import { buildProductAeo, buildMarketplaceAeo } from "../src/modules/seo/aeo";
import { buildProductGeo, buildMarketplaceGeo } from "../src/modules/seo/geo";
import { entityQualityGate, productDiscoveryScores } from "../src/modules/seo/scoring";
import { parseSearchQuery, classifySearchIntent } from "../src/modules/seo/intent";
import { generateFromEntity } from "../src/modules/seo/engine";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const helmet = matchCatalogFromText("Industrial Safety Helmet");
assert(helmet?.child?.key === "safety-helmets" || helmet?.category.key === "safety-equipment", "helmet maps to safety catalog");

const helmetAr = matchCatalogFromText("خوذة سلامة صناعية");
assert(helmetAr?.child?.key === "safety-helmets" || helmetAr?.category.key === "safety-equipment", "Arabic helmet maps");

const phones = matchCatalogFromText("Mobile Phones");
assert(phones, "mobile phones resolve");

const jawwal = matchCatalogFromText("جوالات");
assert(jawwal?.category.key === "electrical", "جوالات → electrical");

assert(findCatalogBySlug("safety-equipment"), "catalog slug index");

assert(classifySearchIntent("موردي الجوالات في الرياض") === "supplier_discovery", "AR supplier intent");
assert(classifySearchIntent("جملة جوالات") === "wholesale", "AR wholesale intent");
assert(parseSearchQuery("موردي mobile phones في الرياض").language === "mixed", "mixed language");

const aeo = buildProductAeo({
  id: "p1",
  nameEn: "Safety Helmet",
  nameAr: "خوذة سلامة",
  manufacturer: "Acme",
  moq: 50,
  vendorName: "Vendor A",
  vendorVerified: true,
  city: "Riyadh",
  country: "Saudi Arabia",
});
assert(aeo.faqs.some((f) => f.a.en?.includes("50")), "MOQ FAQ from data");
assert(aeo.summary.ar?.includes("خوذة"), "Arabic AEO summary");
assert(!aeo.facts.some((f) => /award|capacity/i.test(f.value.en || "")), "no invented claims");

const geo = buildProductGeo({
  id: "p1",
  nameEn: "Safety Helmet",
  nameAr: "خوذة سلامة",
  manufacturer: "Acme",
  moq: 50,
  vendorName: "Vendor A",
});
assert(geo.claims.length >= 2, "GEO claims");
assert(geo.entityCard.ar, "Arabic GEO card");

const thin = entityQualityGate({
  productCount: 0,
  vendorCount: 0,
  hasIntro: true,
  hasTitle: true,
  hasCanonical: true,
  lifecycle: "emerging",
});
assert(thin.indexable === false, "zero supply is not indexable");

const scores = productDiscoveryScores({
  name: { en: "Helmet", ar: "خوذة" },
  categoryId: "x",
  seo: { title: { en: "t", ar: "عنوان" }, description: { en: "d", ar: "وصف" }, canonical: "/ar/p" },
  slug: { en: "helmet" },
  marketplaceEntityIds: ["e"],
  aeo: { faqs: [{}, {}], facts: [{}, {}], summary: { en: "s", ar: "س" } },
  geo: { entityCard: { en: "c", ar: "ك" }, claims: [{}, {}] },
});
assert(scores.seoAr > 0 && scores.seoEn > 0 && scores.discovery > 0, "bilingual discovery scores");

const arTpl = generateFromEntity("category", "ar", { name: "معدات السلامة" });
assert(arTpl.title.includes("موردو") || arTpl.title.includes("معدات"), "Arabic SEO template not English");

const market = buildMarketplaceAeo({
  id: "e1",
  nameEn: "Mobile Phones",
  nameAr: "الهواتف المحمولة",
  introEn: "Handsets for business buyers.",
  introAr: "هواتف للمشترين من الشركات.",
  productCount: 2,
  vendorCount: 2,
  manufacturerCount: 1,
  cities: ["Riyadh"],
  brands: ["Samsung"],
  kind: "category",
});
assert(market.faqs.length >= 1, "entity FAQs from counts");

const marketGeo = buildMarketplaceGeo({
  id: "e1",
  key: "electrical",
  nameEn: "Mobile Phones",
  nameAr: "الهواتف المحمولة",
  productCount: 2,
  vendorCount: 2,
  manufacturerCount: 1,
  cities: ["Riyadh"],
  brands: ["Samsung"],
});
assert(marketGeo.claims.some((c) => c.key === "supply"), "GEO supply claim");

console.log("entity-engine bilingual / GEO / intent checks passed");
