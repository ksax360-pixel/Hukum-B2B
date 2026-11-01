import { existsSync } from "fs";
import path from "path";
import type { MarketplaceSector } from "@/data/marketplace-sectors";

const publicRoot = path.join(process.cwd(), "public");

function publicExists(webPath: string) {
  const clean = webPath.replace(/^\//, "").replace(/\//g, path.sep);
  return existsSync(path.join(publicRoot, clean));
}

/** Prefer optimised WebP cut-outs, then PNG, then legacy homepage assets. */
export function resolveSectorImageSrc(sector: Pick<MarketplaceSector, "slug" | "legacyKeys">): string {
  const candidates = [
    `/images/categories/${sector.slug}.webp`,
    `/images/categories/${sector.slug}.png`,
    ...((sector.legacyKeys || []).flatMap((key) => [
      `/images/categories/${key}.webp`,
      `/images/categories/${key}.png`,
      `/categories/${key}.png`,
      `/categories/${key}.jpg`,
    ])),
    `/categories/${sector.slug}.png`,
    `/categories/${sector.slug}.jpg`,
  ];

  for (const src of candidates) {
    if (publicExists(src)) return src;
  }
  return `/images/categories/${sector.slug}.webp`;
}

export function resolveChildImageSrc(slug: string, legacyKeys: string[] = [], parentSlug?: string) {
  return resolveSectorImageSrc({
    slug,
    legacyKeys: [...legacyKeys, ...(parentSlug ? [parentSlug] : [])],
  });
}
