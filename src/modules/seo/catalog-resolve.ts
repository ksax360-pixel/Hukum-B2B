import { MARKETPLACE_CATEGORIES, type MarketplaceCategory } from "@/data/marketplace-categories";
import { CATEGORY_SYNONYMS } from "@/data/taxonomy-enrichment";
import { SEARCH_SYNONYM_GROUPS } from "@/data/controlled-vocabularies";
import { slugifyText } from "@/lib/utils";

export type CatalogHit = {
  category: MarketplaceCategory;
  child?: { key: string; name: { en: string; ar: string }; slug: { en: string; ar: string } };
};

/** Extra commercial aliases (AR + EN) → catalog key or child key */
const ALIASES: Record<string, string> = {
  "mobile-phone": "electrical",
  "mobile-phones": "electrical",
  "cell-phone": "electrical",
  "cell-phones": "electrical",
  smartphone: "electrical",
  smartphones: "electrical",
  جوال: "electrical",
  جوالات: "electrical",
  هاتف: "electrical",
  هواتف: "electrical",
  "هاتف محمول": "electrical",
  "هواتف محمولة": "electrical",
  "الهواتف المحمولة": "electrical",
  "safety-helmet": "safety-helmets",
  "safety-helmets": "safety-helmets",
  helmet: "safety-helmets",
  helmets: "safety-helmets",
  "خوذة سلامة": "safety-helmets",
  "خوذة سلامة صناعية": "safety-helmets",
  "خوذ السلامة": "safety-helmets",
  "خوذة صناعية": "safety-helmets",
  ppe: "safety-equipment",
  "معدات الحماية الشخصية": "safety-equipment",
  "معدات السلامة": "safety-equipment",
  "مواد البناء": "building-materials",
  "مواد بناء": "building-materials",
};

let slugIndex: Map<string, CatalogHit> | null = null;

function normalizeAr(s: string) {
  return s
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .trim();
}

function buildIndex() {
  if (slugIndex) return slugIndex;
  slugIndex = new Map();
  for (const category of MARKETPLACE_CATEGORIES) {
    const hit: CatalogHit = { category };
    const keys = [
      category.key,
      category.slug.en,
      category.slug.ar,
      slugifyText(category.name.en),
      category.name.ar,
      normalizeAr(category.name.ar),
    ];
    for (const k of keys) if (k) slugIndex.set(k, hit);
    const syn = CATEGORY_SYNONYMS[category.key];
    if (syn) {
      for (const t of syn.en || []) slugIndex.set(t.toLowerCase(), hit);
      for (const t of syn.ar || []) {
        slugIndex.set(t, hit);
        slugIndex.set(normalizeAr(t), hit);
      }
    }
    for (const child of category.children || []) {
      const childHit: CatalogHit = { category, child };
      const childKeys = [
        child.key,
        child.slug.en,
        child.slug.ar,
        slugifyText(child.name.en),
        child.name.ar,
        normalizeAr(child.name.ar),
      ];
      for (const k of childKeys) if (k) slugIndex.set(k, childHit);
    }
  }
  for (const [alias, target] of Object.entries(ALIASES)) {
    const hit = slugIndex.get(target) || slugIndex.get(slugifyText(target));
    if (hit) {
      slugIndex.set(alias, hit);
      slugIndex.set(normalizeAr(alias), hit);
      slugIndex.set(alias.toLowerCase(), hit);
    }
  }
  for (const group of SEARCH_SYNONYM_GROUPS) {
    const key = group.categoryKeys?.[0];
    if (!key) continue;
    const hit = slugIndex.get(key);
    if (!hit) continue;
    for (const t of group.terms) {
      slugIndex.set(t.toLowerCase(), hit);
      slugIndex.set(normalizeAr(t), hit);
    }
  }
  return slugIndex;
}

export function findCatalogBySlug(slug: string): CatalogHit | null {
  if (!slug) return null;
  const idx = buildIndex();
  return idx.get(slugifyText(slug) || slug) || idx.get(slug) || idx.get(normalizeAr(slug)) || null;
}

export function findCatalogByKey(key: string): CatalogHit | null {
  return findCatalogBySlug(key);
}

function stem(s: string) {
  return s.replace(/ies$/, "y").replace(/ses$/, "s").replace(/s$/, "");
}

export function matchCatalogFromText(text: string): CatalogHit | null {
  const raw = (text || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const normAr = normalizeAr(raw);
  const slug = slugifyText(lower);
  const exact =
    findCatalogBySlug(slug) ||
    findCatalogBySlug(lower) ||
    findCatalogBySlug(raw) ||
    findCatalogBySlug(normAr);
  if (exact) return exact;

  // Alias substring match (Arabic commercial terms)
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (normAr.includes(normalizeAr(alias)) || lower.includes(alias.toLowerCase())) {
      const hit = findCatalogBySlug(target);
      if (hit) return hit;
    }
  }

  const tokens = new Set(slug.split("-").map(stem).filter((t) => t.length > 2));
  let best: { hit: CatalogHit; score: number } | null = null;
  for (const category of MARKETPLACE_CATEGORIES) {
    const options: CatalogHit[] = [{ category }, ...(category.children || []).map((child) => ({ category, child }))];
    for (const hit of options) {
      const labelEn = (hit.child?.name.en || hit.category.name.en).toLowerCase();
      const labelAr = hit.child?.name.ar || hit.category.name.ar;
      const labelArNorm = normalizeAr(labelAr);
      if (lower.includes(labelEn) || labelEn.includes(lower) || normAr.includes(labelArNorm) || labelArNorm.includes(normAr)) {
        const score = Math.max(labelEn.length, labelAr.length) + (hit.child ? 25 : 0);
        if (!best || score > best.score) best = { hit, score };
        continue;
      }
      const labelTokens = slugifyText(labelEn)
        .split("-")
        .map(stem)
        .filter((t) => t.length > 2);
      const overlap = labelTokens.filter((t) => tokens.has(t)).length;
      if (overlap && overlap === labelTokens.length) {
        const score = overlap * 10 + (hit.child ? 15 : 0);
        if (!best || score > best.score) best = { hit, score };
      }
    }
  }
  return best?.hit || null;
}

export function relatedCatalogKeys(hit: CatalogHit): string[] {
  const keys = new Set<string>([hit.category.key]);
  if (hit.child) keys.add(hit.child.key);
  for (const child of hit.category.children || []) keys.add(child.key);
  return [...keys];
}

export function entitySynonymsForHit(hit: CatalogHit): { en: string[]; ar: string[] } {
  const key = hit.child?.key || hit.category.key;
  const fromCat = CATEGORY_SYNONYMS[hit.category.key] || { en: [], ar: [] };
  const fromGroups = SEARCH_SYNONYM_GROUPS.filter((g) => g.categoryKeys?.includes(key) || g.categoryKeys?.includes(hit.category.key));
  const en = new Set<string>([hit.category.name.en, hit.child?.name.en || "", ...(fromCat.en || [])]);
  const ar = new Set<string>([hit.category.name.ar, hit.child?.name.ar || "", ...(fromCat.ar || [])]);
  for (const g of fromGroups) {
    for (const t of g.terms) {
      if (/[\u0600-\u06FF]/.test(t)) ar.add(t);
      else en.add(t);
    }
  }
  return {
    en: [...en].filter(Boolean),
    ar: [...ar].filter(Boolean),
  };
}
