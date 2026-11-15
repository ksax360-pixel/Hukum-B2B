import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { Industry, Category, Attribute, CategoryAttributeTemplate } from "@/modules/categories/taxonomy.model";
import { requireSession } from "@/lib/auth";
import { slugifyText } from "@/lib/utils";
import { syncMarketplaceTaxonomy, getCategoryFilters } from "@/modules/categories/taxonomy-sync";
import { buildRfqSchemaForCategory } from "@/modules/categories/rfq-schema";
import { ATTRIBUTE_TEMPLATES, getTemplateForCategoryKey } from "@/data/attribute-templates";
import { expandSearchQuery, resolveSynonymCategoryKeys } from "@/data/controlled-vocabularies";
import { DUPLICATE_CATEGORY_CANDIDATES, CATEGORY_MIGRATION_MAP } from "@/modules/categories/migration-map";

const escapeRe = (v: string): string => v.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(req: Request) {
  try {
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const resource = sp.get("resource") || "industries";

    if (resource === "industries") {
      const items = await Industry.find({ status: { $ne: "archived" } }).sort({ order: 1 }).lean();
      return ok(items);
    }
    if (resource === "categories") {
      const q: Record<string, unknown> = { status: { $ne: "archived" } };
      if (sp.get("industryId")) q.industryId = sp.get("industryId");
      if (sp.get("parentId")) q.parentId = sp.get("parentId");
      if (sp.get("parentId") === "null") q.parentId = null;
      if (sp.get("level")) q.level = Number(sp.get("level"));
      if (sp.get("q")) {
        const terms = expandSearchQuery(sp.get("q") || "");
        q.$or = [
          { "name.en": new RegExp(escapeRe(sp.get("q")!), "i") },
          { "name.ar": new RegExp(escapeRe(sp.get("q")!), "i") },
          { catalogKey: new RegExp(escapeRe(sp.get("q")!), "i") },
          { "synonyms.en": { $in: terms } },
          { "synonyms.ar": { $in: terms } },
        ];
      }
      const items = await Category.find(q).sort({ order: 1 }).lean();
      return ok(items);
    }
    if (resource === "attributes") {
      const q: Record<string, unknown> = { status: { $ne: "archived" } };
      if (sp.get("categoryId")) q.categoryIds = sp.get("categoryId");
      if (sp.get("templateKey")) q.templateKeys = sp.get("templateKey");
      if (sp.get("filterable") === "1") q.filterable = true;
      const items = await Attribute.find(q).sort({ sortOrder: 1 }).lean();
      return ok(items);
    }
    if (resource === "templates") {
      if (sp.get("categoryKey")) {
        return ok(getTemplateForCategoryKey(sp.get("categoryKey")!));
      }
      return ok(ATTRIBUTE_TEMPLATES);
    }
    if (resource === "filters") {
      const categoryId = sp.get("categoryId") || sp.get("categoryKey");
      if (!categoryId) return fail("categoryId or categoryKey required", 400);
      return ok(await getCategoryFilters(categoryId));
    }
    if (resource === "product-form") {
      const categoryKey = sp.get("categoryKey");
      if (!categoryKey) return fail("categoryKey required", 400);
      const { getCategoryDrivenForm } = await import("@/modules/products/category-form");
      return ok(getCategoryDrivenForm(categoryKey));
    }
    if (resource === "category-attributes") {
      const categoryId = sp.get("categoryId");
      if (!categoryId) return fail("categoryId required", 400);
      const items = await CategoryAttributeTemplate.find({ categoryId }).sort({ sortOrder: 1 }).lean();
      return ok(items);
    }
    if (resource === "synonyms") {
      const q = sp.get("q") || "";
      return ok({
        expanded: expandSearchQuery(q),
        categoryKeys: resolveSynonymCategoryKeys(q),
      });
    }
    if (resource === "audit") {
      const { buildTaxonomyAuditReport } = await import("@/modules/categories/taxonomy-audit");
      const industries = await Industry.countDocuments({ status: "active" });
      const categories = await Category.countDocuments({ status: "active" });
      const byLevel = await Category.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: "$level", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      const attributes = await Attribute.countDocuments({ status: "active" });
      const templates = ATTRIBUTE_TEMPLATES.length;
      const missingTemplate = await Category.countDocuments({
        status: "active",
        level: 1,
        $or: [{ attributeTemplateKey: { $exists: false } }, { attributeTemplateKey: null }, { attributeTemplateKey: "" }],
      });
      return ok({
        live: {
          industries,
          categories,
          byLevel,
          attributes,
          templates,
          missingTemplate,
          migrations: CATEGORY_MIGRATION_MAP,
          duplicateCandidates: DUPLICATE_CATEGORY_CANDIDATES,
        },
        catalog: buildTaxonomyAuditReport(),
      });
    }
    if (resource === "tree") {
      const industries = await Industry.find({ status: "active" }).sort({ order: 1 }).lean();
      const categories = await Category.find({ status: "active" }).sort({ order: 1, level: 1 }).lean();
      return ok({ industries, categories });
    }
    return fail("Unknown resource", 400);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

export async function POST(req: Request) {
  try {
    await requireSession("categories:create");
    await connectDB();
    const body = await req.json();
    const type = body.type as string;

    if (type === "industry") {
      const nameEn = body.name?.en || body.nameEn;
      const doc = await Industry.create({
        name: { en: nameEn, ar: body.name?.ar || body.nameAr || "" },
        description: body.description || { en: "", ar: "" },
        slug: { en: slugifyText(nameEn), ar: body.slugAr || "" },
        order: body.order || 0,
        image: body.image,
        icon: body.icon,
        seo: body.seo,
        complianceFlags: body.complianceFlags || [],
      });
      return ok(doc, "Industry created", 201);
    }
    if (type === "category") {
      const nameEn = body.name?.en || body.nameEn;
      const doc = await Category.create({
        industryId: body.industryId,
        parentId: body.parentId || null,
        level: body.level || 1,
        name: { en: nameEn, ar: body.name?.ar || body.nameAr || "" },
        description: body.description || { en: "", ar: "" },
        slug: { en: slugifyText(nameEn), ar: body.slugAr || "" },
        order: body.order || 0,
        attributeIds: body.attributeIds || [],
        filterKeys: body.filterKeys || [],
        requiredAttributeKeys: body.requiredAttributeKeys || [],
        seo: body.seo,
      });
      return ok(doc, "Category created", 201);
    }
    if (type === "attribute") {
      const doc = await Attribute.create({
        key: body.key,
        label: body.label || { en: body.key, ar: "" },
        description: body.description || { en: "", ar: "" },
        type: body.attrType || body.type || "text",
        options: body.options || [],
        required: Boolean(body.required),
        searchable: Boolean(body.searchable),
        filterable: Boolean(body.filterable),
        seoIndexable: Boolean(body.seoIndexable),
        categoryIds: body.categoryIds || [],
      });
      return ok(doc, "Attribute created", 201);
    }
    if (type === "sync-catalog") {
      const result = await syncMarketplaceTaxonomy();
      return ok(result, "Marketplace taxonomy, attributes, and filters synced");
    }
    return fail("Unknown type", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireSession("categories:edit");
    await connectDB();
    const body = await req.json();
    const { id, type, ...updates } = body;
    if (!id || !type) return fail("id and type required", 400);

    if (type === "industry") {
      const doc = await Industry.findByIdAndUpdate(id, updates, { new: true });
      return ok(doc);
    }
    if (type === "category") {
      const doc = await Category.findByIdAndUpdate(id, updates, { new: true });
      return ok(doc);
    }
    if (type === "attribute") {
      const doc = await Attribute.findByIdAndUpdate(id, updates, { new: true });
      return ok(doc);
    }
    return fail("Unknown type", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
