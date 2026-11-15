import { existsSync } from "fs";
import path from "path";
import type { MarketplaceSector } from "@/data/marketplace-sectors";

const publicRoot = path.join(process.cwd(), "public");

function publicExists(webPath: string) {
  const clean = webPath.replace(/^\//, "").replace(/\//g, path.sep);
  return existsSync(path.join(publicRoot, clean));
}

/**
 * When a child slug has no dedicated cut-out, map it to a related asset
 * instead of silently reusing the parent (which made every tile look the same).
 */
const CHILD_IMAGE_ALIASES: Record<string, string[]> = {
  "ppe-kits": ["ppe-kits", "safety-equipment", "hand-protection", "eye-protection"],
  "fall-protection": ["fall-protection", "signage-barriers", "safety-equipment"],
  "safety-helmets": ["safety-equipment", "ppe-kits"],
  "safety-gloves": ["hand-protection"],
  "hi-vis-vests": ["workwear-uniforms"],
  "hearing-protection": ["safety-equipment"],
  "respiratory-protection": ["safety-equipment", "medical-supplies"],
  cement: ["cement-concrete"],
  bricks: ["bricks-blocks"],
  steel: ["steel-rebar"],
  scaffolding: ["site-equipment", "general-contracting"],
  formwork: ["general-contracting", "building-materials"],
  "heavy-equipment": ["site-equipment", "industrial-machinery"],
};

function firstExisting(candidates: string[]): string | undefined {
  for (const src of candidates) {
    if (publicExists(src)) return src;
  }
  return undefined;
}

function pathsForKey(key: string): string[] {
  return [
    `/images/categories/${key}.webp`,
    `/images/categories/${key}.png`,
    `/categories/${key}.png`,
    `/categories/${key}.jpg`,
  ];
}

/** Prefer optimised WebP cut-outs, then PNG, then legacy homepage assets. */
export function resolveSectorImageSrc(sector: Pick<MarketplaceSector, "slug" | "legacyKeys">): string {
  const candidates = [
    ...pathsForKey(sector.slug),
    ...((sector.legacyKeys || []).flatMap((key) => pathsForKey(key))),
  ];

  return firstExisting(candidates) || `/images/categories/${sector.slug}.webp`;
}

export function resolveChildImageSrc(slug: string, legacyKeys: string[] = [], parentSlug?: string) {
  const aliasKeys = CHILD_IMAGE_ALIASES[slug] || [];
  const candidates = [
    ...pathsForKey(slug),
    ...legacyKeys.flatMap((key) => pathsForKey(key)),
    // Distinct related assets before the parent — avoids every child showing the same photo
    ...aliasKeys.filter((k) => k !== slug && k !== parentSlug).flatMap((key) => pathsForKey(key)),
    ...(parentSlug ? pathsForKey(parentSlug) : []),
  ];

  return firstExisting(candidates) || `/images/categories/${slug}.webp`;
}
