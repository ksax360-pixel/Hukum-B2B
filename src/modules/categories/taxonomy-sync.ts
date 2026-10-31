import { Industry, Category, Attribute, CategoryAttributeTemplate } from "@/modules/categories/taxonomy.model";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";
import {
  ATTRIBUTE_TEMPLATES,
  getAllAttributeDefs,
  getTemplateForCategoryKey,
} from "@/data/attribute-templates";
import {
  CATEGORY_SYNONYMS,
  getEnrichmentForKey,
  MISSING_SUBCATEGORY_BACKFILL,
  type TaxonomyNode,
} from "@/data/taxonomy-enrichment";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Default storefront photo for a marketplace catalog key (Frontend/public/categories). */
export function defaultCategoryImagePath(key: string | undefined | null) {
  if (!key) return undefined;
  const safe = String(key)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!safe) return undefined;
  return `/categories/${safe}.jpg`;
}

function shouldKeepCustomImage(image: string | undefined | null) {
  if (!image) return false;
  const v = String(image);
  // Keep manually uploaded / external URLs; overwrite blank or default catalog paths on sync.
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith("/uploads") || v.startsWith("/media") || v.includes("/uploads/")) return true;
  return false;
}

function stableCode(prefix: string, key: string, level: number) {
  const short = key
    .replace(/[^a-z0-9]+/gi, "")
    .toUpperCase()
    .slice(0, 12);
  return `${prefix}-L${level}-${short}`;
}

async function upsertAttributeDefs() {
  const defs = getAllAttributeDefs();
  let created = 0;
  let updated = 0;
  for (const def of defs) {
    const payload = {
      key: def.key,
      label: def.label,
      group: def.group,
      type: def.type === "textarea" ? "textarea" : def.type,
      options: (def.options || []).map((o) => ({ label: o.label, value: o.value })),
      unit: def.unit,
      unitSystem: def.unitSystem || "none",
      allowedUnits: def.allowedUnits || [],
      validation: def.validation || {},
      required: def.requirement === "mandatory",
      recommended: def.requirement === "recommended",
      searchable: Boolean(def.searchable),
      filterable: Boolean(def.filterable),
      seoIndexable: Boolean(def.seoIndexable),
      rfqInheritable: def.rfqInheritable !== false,
      multiValue: Boolean(def.multiValue),
      templateKeys: ATTRIBUTE_TEMPLATES.filter((t) => t.attributes.some((a) => a.key === def.key)).map(
        (t) => t.key
      ),
      status: "active",
    };
    const existing = await Attribute.findOne({ key: def.key });
    if (existing) {
      await Attribute.findByIdAndUpdate(existing._id, payload);
      updated += 1;
    } else {
      await Attribute.create(payload);
      created += 1;
    }
  }
  return { created, updated, total: defs.length };
}

async function upsertChildTree(params: {
  industryId: unknown;
  parentId: unknown;
  parentLevel: number;
  parentPath: unknown[];
  parentSlugsEn: string[];
  parentSlugsAr: string[];
  nodes: TaxonomyNode[];
  counters: { created: number; updated: number };
}) {
  const {
    industryId,
    parentId,
    parentLevel,
    parentPath,
    parentSlugsEn,
    parentSlugsAr,
    nodes,
    counters,
  } = params;

  for (const [idx, node] of nodes.entries()) {
    const level = parentLevel + 1;
    const code = stableCode("CAT", node.key, level);
    const pathSlugsEn = [...parentSlugsEn, node.slug.en];
    const pathSlugsAr = [...parentSlugsAr, node.slug.ar || node.slug.en];

    let doc =
      (await Category.findOne({ catalogKey: node.key })) ||
      (await Category.findOne({ code })) ||
      (await Category.findOne({ icon: node.key, parentId }));

    const defaultImage = defaultCategoryImagePath(node.key);
    const keepImage = shouldKeepCustomImage((doc as { image?: string } | null)?.image);
    const payload: Record<string, unknown> = {
      catalogKey: node.key,
      industryId,
      parentId,
      level,
      path: [...parentPath, parentId].filter(Boolean),
      pathSlugs: { en: pathSlugsEn, ar: pathSlugsAr },
      name: node.name,
      displayName: node.name,
      description: node.description || { en: "", ar: "" },
      slug: node.slug,
      icon: node.key,
      ...(keepImage ? {} : defaultImage ? { image: defaultImage } : {}),
      order: idx + 1,
      status: "active",
      synonyms: node.synonyms || { en: [], ar: [] },
      attributeTemplateKey: undefined as string | undefined,
    };

    if (doc) {
      const codeOwner = await Category.findOne({ code }).select("_id");
      if (!codeOwner || String(codeOwner._id) === String(doc._id)) {
        payload.code = code;
      }
      await Category.findByIdAndUpdate(doc._id, payload);
      counters.updated += 1;
    } else {
      try {
        doc = await Category.create({
          ...payload,
          code,
          image: defaultImage,
        });
        counters.created += 1;
      } catch (err) {
        const e = err as { code?: number };
        if (e?.code !== 11000) throw err;
        doc = await Category.findOne({ $or: [{ code }, { catalogKey: node.key }] });
        if (!doc) throw err;
        await Category.findByIdAndUpdate(doc._id, payload);
        counters.updated += 1;
      }
    }

    if (node.children?.length) {
      await upsertChildTree({
        industryId,
        parentId: doc!._id,
        parentLevel: level,
        parentPath: [...parentPath, parentId, doc!._id].filter(Boolean),
        parentSlugsEn: pathSlugsEn,
        parentSlugsAr: pathSlugsAr,
        nodes: node.children,
        counters,
      });
    }
  }
}

async function bindTemplatesToCategories() {
  let bound = 0;
  for (const cat of MARKETPLACE_CATEGORIES) {
    const tpl = getTemplateForCategoryKey(cat.key);
    if (!tpl) continue;
    const filterKeys = tpl.attributes.filter((a) => a.filterable).map((a) => a.key);
    const requiredAttributeKeys = tpl.attributes
      .filter((a) => a.requirement === "mandatory")
      .map((a) => a.key);
    const recommendedAttributeKeys = tpl.attributes
      .filter((a) => a.requirement === "recommended")
      .map((a) => a.key);

    const attrs = await Attribute.find({ key: { $in: tpl.attributes.map((a) => a.key) } }).select("_id key");
    const attributeIds = attrs.map((a) => a._id);

    const updated = await Category.updateMany(
      { $or: [{ catalogKey: cat.key }, { icon: cat.key }] },
      {
        attributeTemplateKey: tpl.key,
        filterKeys,
        requiredAttributeKeys,
        recommendedAttributeKeys,
        attributeIds,
        synonyms: CATEGORY_SYNONYMS[cat.key] || undefined,
      }
    );
    bound += updated.modifiedCount || 0;

    for (const [idx, attr] of tpl.attributes.entries()) {
      const categoryDocs = await Category.find({
        $or: [{ catalogKey: cat.key }, { icon: cat.key }],
        level: 1,
      }).select("_id");
      for (const c of categoryDocs) {
        await CategoryAttributeTemplate.findOneAndUpdate(
          { categoryId: c._id, attributeKey: attr.key },
          {
            categoryId: c._id,
            templateKey: tpl.key,
            attributeKey: attr.key,
            requirement: attr.requirement || "optional",
            filterable: Boolean(attr.filterable),
            sortOrder: idx,
          },
          { upsert: true }
        );
      }
    }
  }
  return bound;
}

export type TaxonomySyncResult = {
  industriesCreated: number;
  categoriesCreated: number;
  categoriesUpdated: number;
  attributes: { created: number; updated: number; total: number };
  templatesBound: number;
  enrichmentNodes: number;
};

export async function syncMarketplaceTaxonomy(): Promise<TaxonomySyncResult> {
  const industryByName = new Map<string, { _id: unknown }>();
  let industriesCreated = 0;
  const counters = { created: 0, updated: 0 };
  let enrichmentNodes = 0;

  for (const cat of MARKETPLACE_CATEGORIES) {
    const key = cat.industry.en;
    if (!industryByName.has(key)) {
      const slugEn = slugify(key);
      const code = `IND-${slugEn.toUpperCase().replace(/-/g, "").slice(0, 10)}`;
      let ind = await Industry.findOne({ $or: [{ "name.en": key }, { code }] });
      if (!ind) {
        ind = await Industry.create({
          code,
          name: cat.industry,
          displayName: cat.industry,
          slug: { en: slugEn, ar: slugEn },
          description: {
            en: `${cat.industry.en} suppliers and procurement on Hukum.`,
            ar: `موردو ومشتريات ${cat.industry.ar} على Hukum.`,
          },
          icon: cat.key,
          image: defaultCategoryImagePath(cat.key),
          order: industryByName.size + 1,
          status: "active",
        });
        industriesCreated += 1;
      } else {
        const industryPatch: Record<string, unknown> = {};
        if (!ind.code) {
          industryPatch.code = code;
          industryPatch.displayName = cat.industry;
        }
        if (!shouldKeepCustomImage((ind as { image?: string }).image)) {
          industryPatch.image = defaultCategoryImagePath(cat.key);
        }
        if (Object.keys(industryPatch).length) {
          await Industry.findByIdAndUpdate(ind._id, industryPatch);
        }
      }
      industryByName.set(key, ind);
    }
  }

  for (const cat of MARKETPLACE_CATEGORIES) {
    const industry = industryByName.get(cat.industry.en)!;
    const code = stableCode("CAT", cat.key, 1);
    const synonyms = CATEGORY_SYNONYMS[cat.key] || { en: [], ar: [] };
    const tpl = getTemplateForCategoryKey(cat.key);

    let existing = await Category.findOne({
      $or: [{ catalogKey: cat.key }, { "slug.en": cat.slug.en }, { icon: cat.key }],
      level: 1,
    });

    const defaultImage = defaultCategoryImagePath(cat.key);
    const keepImage = shouldKeepCustomImage((existing as { image?: string } | null)?.image);
    const level1Payload = {
      code,
      catalogKey: cat.key,
      industryId: industry._id,
      parentId: null,
      level: 1,
      path: [],
      pathSlugs: { en: [cat.slug.en], ar: [cat.slug.ar || cat.slug.en] },
      name: cat.name,
      displayName: cat.name,
      description: cat.description,
      slug: cat.slug,
      icon: cat.key,
      ...(keepImage ? {} : defaultImage ? { image: defaultImage } : {}),
      order: cat.order,
      status: "active",
      synonyms,
      attributeTemplateKey: tpl?.key,
      seo: {
        title: {
          en: `${cat.name.en} Suppliers in Saudi Arabia | Hukum`,
          ar: `موردو ${cat.name.ar} في السعودية | Hukum`,
        },
        description: cat.description,
        slug: cat.slug,
        keywords: {
          en: [cat.name.en, ...(synonyms.en || [])].join(", "),
          ar: [cat.name.ar, ...(synonyms.ar || [])].join("، "),
        },
        indexable: true,
        follow: true,
        schemaType: "CollectionPage",
      },
    };

    if (existing) {
      await Category.findByIdAndUpdate(existing._id, level1Payload);
      counters.updated += 1;
    } else {
      existing = await Category.create({
        ...level1Payload,
        image: defaultImage,
      });
      counters.created += 1;
    }

    const childNodes: TaxonomyNode[] = [];
    if (cat.children?.length) {
      for (const child of cat.children) {
        const deeper = getEnrichmentForKey(child.key);
        childNodes.push({
          key: child.key,
          name: child.name,
          slug: child.slug,
          children: deeper.length ? deeper : undefined,
        });
        enrichmentNodes += deeper.length;
      }
    } else {
      const backfill = MISSING_SUBCATEGORY_BACKFILL[cat.key] || getEnrichmentForKey(cat.key);
      if (backfill.length) {
        childNodes.push(...backfill);
        enrichmentNodes += backfill.length;
      }
    }

    if (childNodes.length) {
      await upsertChildTree({
        industryId: industry._id,
        parentId: existing!._id,
        parentLevel: 1,
        parentPath: [existing!._id],
        parentSlugsEn: [cat.slug.en],
        parentSlugsAr: [cat.slug.ar || cat.slug.en],
        nodes: childNodes,
        counters,
      });
    }
  }

  const attributes = await upsertAttributeDefs();
  const templatesBound = await bindTemplatesToCategories();

  return {
    industriesCreated,
    categoriesCreated: counters.created,
    categoriesUpdated: counters.updated,
    attributes,
    templatesBound,
    enrichmentNodes,
  };
}

export async function getCategoryFilters(categoryIdOrKey: string) {
  const { Types } = await import("mongoose");
  const or: Record<string, unknown>[] = [
    { catalogKey: categoryIdOrKey },
    { icon: categoryIdOrKey },
    { code: categoryIdOrKey },
  ];
  if (Types.ObjectId.isValid(categoryIdOrKey)) {
    or.unshift({ _id: categoryIdOrKey });
  }
  const cat = await Category.findOne({ $or: or }).lean();
  if (!cat) {
    return {
      category: null,
      filters: [] as {
        key: string;
        label: { en: string; ar: string };
        type: string;
        options?: unknown[];
      }[],
    };
  }

  const keys =
    (cat.filterKeys as string[] | undefined)?.length
      ? (cat.filterKeys as string[])
      : getTemplateForCategoryKey((cat.catalogKey as string) || (cat.icon as string) || "")?.attributes
          .filter((a) => a.filterable)
          .map((a) => a.key) || [];

  const attrs = await Attribute.find({ key: { $in: keys }, filterable: true, status: "active" })
    .sort({ sortOrder: 1 })
    .lean();

  return {
    category: cat,
    filters: attrs.map((a) => ({
      key: a.key,
      label: a.label,
      type: a.type,
      options: a.options,
      group: a.group,
      unit: a.unit,
    })),
  };
}
