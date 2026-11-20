import { Types } from "mongoose";
import { Product } from "@/modules/products/product.model";
import { Category, Industry } from "@/modules/categories/taxonomy.model";
import { toPlain } from "@/components/products/product-helpers";

export type FacetNamed = {
  _id: string;
  name?: { en?: string; ar?: string };
  code?: string;
  count: number;
};

type LeafDoc = {
  _id: unknown;
  name?: { en?: string; ar?: string };
  code?: string;
  parentId?: unknown;
  industryId?: unknown;
  level?: number;
};

/**
 * Buyer filters built only from published products in Mongo —
 * Industry → Category → Product type. Empty taxonomy nodes never appear.
 */
export async function loadPublishedTaxonomyFacets(opts: {
  industryId?: string;
  categoryId?: string;
}): Promise<{
  industries: FacetNamed[];
  categories: FacetNamed[];
  productTypes: FacetNamed[];
  selectedIndustryId: string;
  selectedCategoryId: string;
  selectedTypeId: string;
}> {
  const industryAgg = await Product.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: { status: "published", industryId: { $ne: null } } },
    { $group: { _id: "$industryId", n: { $sum: 1 } } },
  ]);

  const industryCounts = new Map(industryAgg.map((r) => [String(r._id), r.n]));
  const industryDocs = industryCounts.size
    ? await Industry.find({ _id: { $in: [...industryCounts.keys()] } })
        .select("_id name code order status")
        .sort({ order: 1 })
        .lean()
    : [];

  const industries: FacetNamed[] = industryDocs
    .filter((d) => (d.status || "active") !== "archived")
    .map((d) => ({
      _id: String(d._id),
      name: d.name as { en?: string; ar?: string },
      code: d.code as string | undefined,
      count: industryCounts.get(String(d._id)) || 0,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count || String(a.name?.en || "").localeCompare(String(b.name?.en || "")));

  let selectedIndustryId = String(opts.industryId || "");
  if (selectedIndustryId && !industries.some((i) => i._id === selectedIndustryId)) {
    selectedIndustryId = "";
  }

  // Category counts only inside the selected industry (or empty until industry picked).
  let categories: FacetNamed[] = [];
  let productTypes: FacetNamed[] = [];
  let selectedCategoryId = "";
  let selectedTypeId = "";
  let leaves: LeafDoc[] = [];
  const typeCounts = new Map<string, number>();

  if (selectedIndustryId) {
    const catAgg = await Product.aggregate<{ _id: Types.ObjectId; n: number }>([
      {
        $match: {
          status: "published",
          industryId: new Types.ObjectId(selectedIndustryId),
          categoryId: { $ne: null },
        },
      },
      { $group: { _id: "$categoryId", n: { $sum: 1 } } },
    ]);

    for (const row of catAgg) {
      typeCounts.set(String(row._id), row.n);
    }

    leaves = typeCounts.size
      ? ((await Category.find({ _id: { $in: [...typeCounts.keys()] } })
          .select("_id name code parentId industryId level")
          .lean()) as LeafDoc[])
      : [];

    const categoryCounts = new Map<string, number>();
    for (const leaf of leaves) {
      const leafId = String(leaf._id);
      const n = typeCounts.get(leafId) || 0;
      const parent = leaf.parentId ? String(leaf.parentId) : "";
      if (parent) {
        categoryCounts.set(parent, (categoryCounts.get(parent) || 0) + n);
      } else {
        categoryCounts.set(leafId, (categoryCounts.get(leafId) || 0) + n);
      }
    }

    const categoryDocs = categoryCounts.size
      ? await Category.find({ _id: { $in: [...categoryCounts.keys()] } })
          .select("_id name code order")
          .sort({ order: 1 })
          .lean()
      : [];

    categories = categoryDocs
      .map((d) => ({
        _id: String(d._id),
        name: d.name as { en?: string; ar?: string },
        code: d.code as string | undefined,
        count: categoryCounts.get(String(d._id)) || 0,
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count || String(a.name?.en || "").localeCompare(String(b.name?.en || "")));

    const rawCat = String(opts.categoryId || "");
    const selectedLeaf = leaves.find((l) => String(l._id) === rawCat);

    if (selectedLeaf?.parentId) {
      selectedTypeId = rawCat;
      selectedCategoryId = String(selectedLeaf.parentId);
    } else if (rawCat && categories.some((c) => c._id === rawCat)) {
      selectedCategoryId = rawCat;
    } else if (selectedLeaf && !selectedLeaf.parentId) {
      selectedCategoryId = rawCat;
    }

    if (selectedCategoryId) {
      productTypes = leaves
        .filter((l) => String(l.parentId || "") === selectedCategoryId)
        .map((d) => ({
          _id: String(d._id),
          name: d.name as { en?: string; ar?: string },
          code: d.code as string | undefined,
          count: typeCounts.get(String(d._id)) || 0,
        }))
        .filter((d) => d.count > 0)
        .sort((a, b) => b.count - a.count || String(a.name?.en || "").localeCompare(String(b.name?.en || "")));
    }
  }

  return {
    industries: toPlain(industries) as FacetNamed[],
    categories: toPlain(categories) as FacetNamed[],
    productTypes: toPlain(productTypes) as FacetNamed[],
    selectedIndustryId,
    selectedCategoryId,
    selectedTypeId,
  };
}
