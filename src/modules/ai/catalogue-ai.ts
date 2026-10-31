/**
 * Live AI catalogue enrichment — fresh copy + DALL·E images (no stock product DB).
 */
import { persistUpload } from "@/lib/persist-upload";
import { aiImageCount, aiProvider } from "@/modules/ai/provider";
import {
  enrichCatalogueDraft,
  type CatalogueDraftPreview,
  type CatalogueExtractRow,
} from "@/modules/ai/catalogue-draft";

const ANGLE_HINTS = [
  "hero product shot on clean white seamless background, centered, soft studio lighting, B2B ecommerce catalog style",
  "alternate studio angle, three-quarter view, soft shadows, commercial product photography",
  "lifestyle / in-use context for B2B buyers, realistic scene, no text overlays, no logos",
];

function parseJsonObject(content: string): Record<string, unknown> | null {
  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function generateFreshCopy(draft: CatalogueDraftPreview): Promise<Partial<CatalogueDraftPreview>> {
  if (!aiProvider.isConfigured()) return {};
  try {
    const result = await aiProvider.complete(
      [
        {
          role: "system",
          content:
            "You write clean bilingual B2B marketplace listing copy for Hukum (Saudi). Return ONLY JSON with keys: shortDescription:{en,ar}, description:{en,ar}, applications:{en,ar}, seo:{title:{en,ar},description:{en,ar},keywords:{en,ar}}. Never invent fake certifications. Keep SEO title under 60 chars, meta description under 155 chars.",
        },
        {
          role: "user",
          content: JSON.stringify({
            nameEn: draft.nameEn,
            nameAr: draft.nameAr,
            brand: draft.brand,
            categoryHint: draft.categoryHint,
            specs: draft.specs,
            price: draft.price,
            retailPrice: draft.retailPrice,
            currency: draft.currency,
            moq: draft.moq,
          }),
        },
      ],
      { temperature: 0.35 }
    );
    const parsed = parseJsonObject(result.content);
    if (!parsed) return {};

    const short = parsed.shortDescription as { en?: string; ar?: string } | undefined;
    const desc = parsed.description as { en?: string; ar?: string } | undefined;
    const apps = parsed.applications as { en?: string; ar?: string } | undefined;
    const seo = parsed.seo as {
      title?: { en?: string; ar?: string };
      description?: { en?: string; ar?: string };
      keywords?: { en?: string; ar?: string };
    } | undefined;

    return {
      shortDescription: {
        en: String(short?.en || draft.shortDescription.en),
        ar: String(short?.ar || draft.shortDescription.ar),
      },
      description: {
        en: String(desc?.en || draft.description.en),
        ar: String(desc?.ar || draft.description.ar),
      },
      applications: {
        en: String(apps?.en || draft.applications.en),
        ar: String(apps?.ar || draft.applications.ar),
      },
      seo: {
        title: {
          en: String(seo?.title?.en || draft.seo.title.en),
          ar: String(seo?.title?.ar || draft.seo.title.ar),
        },
        description: {
          en: String(seo?.description?.en || draft.seo.description.en),
          ar: String(seo?.description?.ar || draft.seo.description.ar),
        },
        keywords: {
          en: String(seo?.keywords?.en || draft.seo.keywords.en),
          ar: String(seo?.keywords?.ar || draft.seo.keywords.ar),
        },
        h1: draft.seo.h1,
        indexable: true,
      },
      source: "ai",
      confidence: Math.max(draft.confidence, 0.82),
    };
  } catch {
    return {};
  }
}

function imagePromptFor(draft: CatalogueDraftPreview, angleIndex: number, changeNote?: string) {
  const angle = ANGLE_HINTS[angleIndex % ANGLE_HINTS.length];
  const change = changeNote ? ` Apply this change: ${changeNote}.` : "";
  return [
    `Professional product photograph of: ${draft.nameEn}.`,
    draft.brand ? `Brand feel: ${draft.brand}.` : "",
    draft.categoryHint ? `Category: ${draft.categoryHint}.` : "",
    angle + ".",
    "Photorealistic, high detail, no watermarks, no readable text, no logos, marketplace ready.",
    change,
  ]
    .filter(Boolean)
    .join(" ");
}

async function persistGeneratedImage(opts: {
  buffer: Buffer;
  mimeType: string;
  vendorId: string;
  productKey: string;
  index: number;
  alt: { en: string; ar: string };
}) {
  const ext = opts.mimeType.includes("jpeg") || opts.mimeType.includes("jpg") ? "jpg" : "png";
  const saved = await persistUpload({
    kind: "product",
    buffer: opts.buffer,
    originalName: `ai-${opts.productKey}-${opts.index}.${ext}`,
    mimeType: opts.mimeType.includes("jpeg") ? "image/jpeg" : "image/png",
    vendorId: opts.vendorId,
    productId: opts.productKey,
  });
  return {
    url: saved.url,
    type: "image" as const,
    isPrimary: opts.index === 0,
    order: opts.index,
    alt: opts.alt,
  };
}

/** Generate 2–3 fresh DALL·E images and store under vendor uploads. */
export async function generateCatalogueImages(
  draft: CatalogueDraftPreview,
  opts: { vendorId: string; changeNote?: string; onlyIndexes?: number[] }
): Promise<CatalogueDraftPreview["media"]> {
  const count = aiImageCount();
  const indexes =
    opts.onlyIndexes && opts.onlyIndexes.length
      ? opts.onlyIndexes.filter((i) => i >= 0 && i < count)
      : Array.from({ length: count }, (_, i) => i);

  const media = [...(draft.media || [])];
  while (media.length < count) {
    media.push({
      url: draft.imageUrl || "",
      type: "image",
      isPrimary: media.length === 0,
      order: media.length,
      alt: { en: draft.nameEn, ar: draft.nameAr },
    });
  }

  const productKey = `catalogue-${draft.sku || "item"}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "item";

  for (const i of indexes) {
    const generated = await aiProvider.generateImage(imagePromptFor(draft, i, opts.changeNote));
    media[i] = await persistGeneratedImage({
      buffer: generated.buffer,
      mimeType: generated.mimeType,
      vendorId: opts.vendorId,
      productKey,
      index: i,
      alt: {
        en: `${draft.nameEn} — view ${i + 1}`,
        ar: `${draft.nameAr} — عرض ${i + 1}`,
      },
    });
  }

  return media.slice(0, count).map((m, i) => ({
    ...m,
    type: "image" as const,
    isPrimary: i === 0,
    order: i,
  }));
}

/** Full AI enrich: fresh copy + generated images (skips stock library when AI works). */
export async function enrichCatalogueDraftWithAi(
  row: CatalogueExtractRow,
  opts: { vendorId: string; index?: number; generateImages?: boolean }
): Promise<CatalogueDraftPreview> {
  let draft = enrichCatalogueDraft(row, opts.index || 0);
  const copy = await generateFreshCopy(draft);
  draft = { ...draft, ...copy, seo: copy.seo || draft.seo };

  if (opts.generateImages !== false && aiProvider.isConfigured()) {
    try {
      const media = await generateCatalogueImages(draft, { vendorId: opts.vendorId });
      draft = {
        ...draft,
        media,
        imageUrl: media[0]?.url || draft.imageUrl,
        source: "ai",
      };
    } catch (err) {
      // Keep text enrichment; surface image failure as tags for UI
      draft = {
        ...draft,
        tags: [...new Set([...(draft.tags || []), "image-gen-failed"])],
        specs: {
          ...draft.specs,
          imageGenError: (err as Error).message?.slice(0, 180) || "image generation failed",
        },
      };
    }
  }

  return draft;
}

export async function enrichCatalogueDraftsWithAi(
  rows: CatalogueExtractRow[],
  opts: { vendorId: string; generateImages?: boolean }
): Promise<CatalogueDraftPreview[]> {
  const out: CatalogueDraftPreview[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    out.push(
      await enrichCatalogueDraftWithAi(rows[i], {
        vendorId: opts.vendorId,
        index: i,
        generateImages: opts.generateImages,
      })
    );
  }
  return out;
}

/**
 * Apply particular seller change notes to one draft (copy and/or regenerate images).
 * Example: "make bottle blue", "shorter SEO title", "regenerate image 2".
 */
export async function applyCatalogueDraftChanges(
  draft: CatalogueDraftPreview,
  changeNote: string,
  opts: { vendorId: string }
): Promise<CatalogueDraftPreview> {
  const note = String(changeNote || "").trim();
  if (!note) return draft;

  let next: CatalogueDraftPreview = { ...draft };
  const lower = note.toLowerCase();
  const wantsImages =
    /image|photo|picture|pic|visual|color|colour|background|angle|regenerat|dall/i.test(lower);
  const wantsCopy =
    /title|name|desc|seo|meta|keyword|copy|text|price|moq|brand|arabic|english|short/i.test(lower) ||
    !wantsImages;

  if (wantsCopy && aiProvider.isConfigured()) {
    try {
      const result = await aiProvider.complete(
        [
          {
            role: "system",
            content:
              "You update ONE B2B product draft per seller instructions. Return ONLY JSON merging changes into: nameEn, nameAr, brand, categoryHint, price, retailPrice, moq, currency, shortDescription:{en,ar}, description:{en,ar}, applications:{en,ar}, seo:{title:{en,ar},description:{en,ar},keywords:{en,ar}}. Keep unchanged fields. Never invent certifications.",
          },
          {
            role: "user",
            content: JSON.stringify({ current: draft, changeRequest: note }),
          },
        ],
        { temperature: 0.3 }
      );
      const parsed = parseJsonObject(result.content);
      if (parsed) {
        const base = enrichCatalogueDraft(
          {
            ...draft,
            nameEn: String(parsed.nameEn || draft.nameEn),
            nameAr: String(parsed.nameAr || draft.nameAr),
            brand: String(parsed.brand ?? draft.brand),
            categoryHint: String(parsed.categoryHint || draft.categoryHint),
            price: parsed.price != null ? Number(parsed.price) : draft.price,
            discountPrice:
              parsed.retailPrice != null ? Number(parsed.retailPrice) : draft.retailPrice,
            moq: parsed.moq != null ? Number(parsed.moq) : draft.moq,
            currency: String(parsed.currency || draft.currency),
            shortDescription: (parsed.shortDescription as CatalogueDraftPreview["shortDescription"]) || draft.shortDescription,
            description: (parsed.description as CatalogueDraftPreview["description"]) || draft.description,
            seo: {
              title: (parsed as { seo?: CatalogueDraftPreview["seo"] }).seo?.title || draft.seo.title,
              description:
                (parsed as { seo?: CatalogueDraftPreview["seo"] }).seo?.description || draft.seo.description,
              keywords:
                (parsed as { seo?: CatalogueDraftPreview["seo"] }).seo?.keywords || draft.seo.keywords,
            },
            media: draft.media,
            imageUrl: draft.imageUrl,
            source: "ai",
            confidence: draft.confidence,
            specs: draft.specs,
            sku: draft.sku,
          },
          0
        );
        // Preserve AI-generated media; enrichCatalogueDraft would replace with stock
        next = {
          ...base,
          media: draft.media,
          imageUrl: draft.imageUrl,
          source: "ai",
        };
      }
    } catch {
      /* keep previous copy */
    }
  }

  if (wantsImages && aiProvider.isConfigured()) {
    const indexMatch = note.match(/image\s*([123]|one|two|three)/i);
    let onlyIndexes: number[] | undefined;
    if (indexMatch) {
      const raw = indexMatch[1].toLowerCase();
      const map: Record<string, number> = { "1": 0, one: 0, "2": 1, two: 1, "3": 2, three: 2 };
      onlyIndexes = [map[raw] ?? 0];
    }
    try {
      const media = await generateCatalogueImages(next, {
        vendorId: opts.vendorId,
        changeNote: note,
        onlyIndexes,
      });
      next = {
        ...next,
        media,
        imageUrl: media[0]?.url || next.imageUrl,
        source: "ai",
      };
    } catch (err) {
      next = {
        ...next,
        specs: {
          ...next.specs,
          imageGenError: (err as Error).message?.slice(0, 180) || "image regeneration failed",
        },
      };
    }
  }

  return next;
}
