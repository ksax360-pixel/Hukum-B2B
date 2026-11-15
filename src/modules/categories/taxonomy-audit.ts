import { ATTRIBUTE_TEMPLATES, getAllAttributeDefs } from "@/data/attribute-templates";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";
import { MARKETPLACE_INDUSTRIES } from "@/data/marketplace-industries";
import { MISSING_SUBCATEGORY_BACKFILL, TAXONOMY_ENRICHMENT, CATEGORY_SYNONYMS } from "@/data/taxonomy-enrichment";
import { BUYER_INTENT_TAGS, DOCUMENT_TYPES, SEARCH_SYNONYM_GROUPS, CERTIFICATION_STANDARDS } from "@/data/controlled-vocabularies";
import { DUPLICATE_CATEGORY_CANDIDATES, CATEGORY_MIGRATION_MAP } from "@/modules/categories/migration-map";

function countEnrichmentNodes() {
  let n = 0;
  const walk = (nodes: { children?: unknown[] }[]) => {
    for (const node of nodes) {
      n += 1;
      if (Array.isArray(node.children)) walk(node.children as { children?: unknown[] }[]);
    }
  };
  for (const nodes of Object.values(TAXONOMY_ENRICHMENT)) walk(nodes);
  for (const nodes of Object.values(MISSING_SUBCATEGORY_BACKFILL)) walk(nodes);
  return n;
}

function categoriesMissingChildren() {
  return MARKETPLACE_CATEGORIES.filter((c) => !c.children?.length).map((c) => c.key);
}

function categoriesNowBackfilled() {
  return categoriesMissingChildren().filter((k) => (MISSING_SUBCATEGORY_BACKFILL[k] || []).length > 0);
}

export function buildTaxonomyAuditReport() {
  const attrs = getAllAttributeDefs();
  const filterable = attrs.filter((a) => a.filterable);
  const withChildren = MARKETPLACE_CATEGORIES.filter((c) => (c.children?.length || 0) > 0).length;
  const missingBefore = categoriesMissingChildren();
  const backfilled = categoriesNowBackfilled();
  const stillMissing = missingBefore.filter((k) => !backfilled.includes(k));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      industries: MARKETPLACE_INDUSTRIES.length,
      topLevelCategories: MARKETPLACE_CATEGORIES.length,
      categoriesWithNativeChildren: withChildren,
      subcategoryBackfillParents: backfilled.length,
      enrichmentNodes: countEnrichmentNodes(),
      attributeTemplates: ATTRIBUTE_TEMPLATES.length,
      uniqueAttributes: attrs.length,
      filterableAttributes: filterable.length,
      buyerIntentTags: Object.keys(BUYER_INTENT_TAGS).length,
      documentTypes: DOCUMENT_TYPES.length,
      certificationStandards: Object.keys(CERTIFICATION_STANDARDS).length,
      searchSynonymGroups: SEARCH_SYNONYM_GROUPS.length,
      categorySynonymSets: Object.keys(CATEGORY_SYNONYMS).length,
      migrationRules: CATEGORY_MIGRATION_MAP.length,
    },
    existing: {
      industries: MARKETPLACE_INDUSTRIES.map((i) => i.name.en),
      categories: MARKETPLACE_CATEGORIES.map((c) => ({
        key: c.key,
        name: c.name.en,
        industry: c.industry.en,
        children: c.children?.length || 0,
        template: ATTRIBUTE_TEMPLATES.find((t) => t.categoryKeys.includes(c.key))?.key || "generic",
      })),
    },
    gapsFixed: {
      subcategoryBackfill: backfilled,
      productTypeEnrichmentKeys: Object.keys(TAXONOMY_ENRICHMENT),
      attributeTemplatesAdded: ATTRIBUTE_TEMPLATES.map((t) => t.key),
      structuredCertifications: true,
      vendorManufacturerDistributorProfiles: true,
      rfqAttributeInheritance: true,
      seoFromStructuredData: true,
      searchSynonyms: true,
      documentTypeExpansion: DOCUMENT_TYPES.length,
    },
    remainingGaps: {
      categoriesStillFlatAfterBackfill: stillMissing,
      duplicateReviewNeeded: DUPLICATE_CATEGORY_CANDIDATES,
      adminAttributeBuilderUi: "API ready; visual builder can extend admin taxonomy page",
      bulkImportValidationUi: "Schema ready; CSV/Excel UI not fully built",
      liveOpensearch: "Mongo text + synonym expansion in place; OpenSearch adapter stubbed via SearchEngine interface",
    },
    templates: ATTRIBUTE_TEMPLATES.map((t) => ({
      key: t.key,
      name: t.name.en,
      categoryKeys: t.categoryKeys,
      attributeCount: t.attributes.length,
      filterCount: t.attributes.filter((a) => a.filterable).length,
      mandatoryCount: t.attributes.filter((a) => a.requirement === "mandatory").length,
    })),
    functionalityChain: [
      "Vendor profile → capabilities / verification / contact settings",
      "Industry → Category → Subcategory → Product type (variable depth)",
      "Attribute template → required/recommended/optional → product attributes",
      "Filters generated from filterable attributes",
      "Search uses title, tags, synonyms, category path, attributes",
      "SEO generated from structured product/category data",
      "RFQ inherits category attribute schema for buyer requirements",
      "Matching score compares requirements ↔ product attributes",
      "Completeness + SEO readiness scores for admin quality",
      "Analytics events already keyed by product/vendor (contact + RFQ)",
    ],
  };
}
