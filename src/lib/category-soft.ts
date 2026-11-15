import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";

const SOFT_BY_KEY = new Map(MARKETPLACE_CATEGORIES.map((c) => [c.key, c.soft]));

const FALLBACK_SOFT = [
  "#FFE4E6",
  "#FFEDD5",
  "#FEF3C7",
  "#DCFCE7",
  "#E0F2FE",
  "#E0E7FF",
  "#FCE7F3",
  "#EDE9FE",
  "#CFFAFE",
  "#ECFCCB",
];

/** Soft disc color for homepage — prefers static catalog match, else stable hash. */
export function softColorForCategoryKey(key?: string | null) {
  if (key && SOFT_BY_KEY.has(key)) return SOFT_BY_KEY.get(key)!;
  const seed = String(key || "cat");
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACK_SOFT[h % FALLBACK_SOFT.length];
}
