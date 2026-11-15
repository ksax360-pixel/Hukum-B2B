/**
 * Safe remapping of legacy / overlapping category keys.
 * Products keep ObjectId refs; catalogKey migration uses this map.
 * Low-confidence rows require admin review — never auto-merge buyer-intent duplicates blindly.
 */

export type MigrationRule = {
  fromCatalogKey: string;
  toCatalogKey: string;
  confidence: number;
  reason: string;
  autoApply: boolean;
};

export const CATEGORY_MIGRATION_MAP: MigrationRule[] = [
  {
    fromCatalogKey: "electrical-products",
    toCatalogKey: "electrical",
    confidence: 0.95,
    reason: "Legacy alias → Electrical & Electronics",
    autoApply: true,
  },
  {
    fromCatalogKey: "safety",
    toCatalogKey: "safety-equipment",
    confidence: 0.9,
    reason: "Short alias → Safety Equipment",
    autoApply: true,
  },
  {
    fromCatalogKey: "ppe",
    toCatalogKey: "safety-equipment",
    confidence: 0.95,
    reason: "PPE synonym → Safety Equipment (canonical)",
    autoApply: true,
  },
  {
    fromCatalogKey: "building-supplies",
    toCatalogKey: "building-materials",
    confidence: 0.9,
    reason: "Alias → Building Materials",
    autoApply: true,
  },
  {
    fromCatalogKey: "machinery",
    toCatalogKey: "industrial-machinery",
    confidence: 0.85,
    reason: "Short alias → Industrial Machinery",
    autoApply: true,
  },
  {
    // Intentional non-merge: keep distinct for buyer intent
    fromCatalogKey: "fmcg",
    toCatalogKey: "fmcg",
    confidence: 1,
    reason: "FMCG and Food & Beverage remain separate buyer paths",
    autoApply: false,
  },
];

/** Duplicate terminology flagged for admin review — do not auto-merge */
export const DUPLICATE_CATEGORY_CANDIDATES: Array<{
  keys: string[];
  note: string;
  action: "keep_separate" | "review" | "merge_candidate";
}> = [
  {
    keys: ["fmcg", "food-beverage"],
    note: "Overlapping grocery intent; FMCG = packaged retail, Food & Beverage = HORECA/wholesale food. Keep separate.",
    action: "keep_separate",
  },
  {
    keys: ["textiles", "apparel"],
    note: "Fabric vs finished garments — keep separate with cross-links.",
    action: "keep_separate",
  },
  {
    keys: ["it-services", "telecom", "security-systems"],
    note: "Related tech verticals — complementary, not duplicates.",
    action: "keep_separate",
  },
  {
    keys: ["office-supplies", "stationery"],
    note: "Stationery is a subset; keep hierarchy via relatedCategories, do not merge.",
    action: "keep_separate",
  },
];

export function resolveMigrationTarget(catalogKey: string): MigrationRule | null {
  return CATEGORY_MIGRATION_MAP.find((r) => r.fromCatalogKey === catalogKey && r.autoApply) || null;
}
