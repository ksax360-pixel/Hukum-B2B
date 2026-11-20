import { Product } from "@/modules/products/product.model";
import { Category, Industry } from "@/modules/categories/taxonomy.model";
import { toPlain } from "@/components/products/product-helpers";

export type FacetNamed = {
  _id: string;
  name?: { en?: string; ar?: string };
  code?: string;
  count: number;
};

/**
 * Build buyer filter facets from published products only —
 * Industry → Category → Product type, no empty taxonomy noise.
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
  const published = await Product.find({ status: "published" })
    .select("industryId categoryId")
    .lean();

  const industryCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  const leafIds = new Set<string>();

  for (const p of published) {
    const ind = String(p.industryId || "");
    const cat = String(p.categoryId || "");
    if (ind) industryCounts.set(ind, (industryCounts.get(ind) || 0) + 1);
    if (cat) {
      leafIds.add(cat);
      typeCounts.set(cat, (typeCounts.get(cat) || 0) + 1);
    }
  }

  const leaves = leafIds.size
    ? await Category.find({ _id: { $in: [...leafIds] } })
        .select("_id name code parentId industryId level path")
        .lean()
    : [];

  const parentIds = new Set<string>();
  for (const leaf of leaves) {
    const parent = leaf.parentId ? String(leaf.parentId) : "";
    if (parent) {
      parentIds.add(parent);
      const n = typeCounts.get(String(leaf._id)) || 0;
      categoryCounts.set(parent, (categoryCounts.get(parent) || 0) + n);
    } else {
      // Leaf is already L1 — treat as category facet
      categoryCounts.set(String(leaf._id), typeCounts.get(String(leaf._id)) || 0);
    }
    const ind = String(leaf.industryId || "");
    if (ind && !industryCounts.has(ind)) {
      industryCounts.set(ind, typeCounts.get(String(leaf._id)) || 0);
    }
  }

  const industryDocs = industryCounts.size
    ? await Industry.find({ _id: { $in: [...industryCounts.keys()] }, status: "active" })
        .select("_id name code order")
        .sort({ order: 1 })
        .lean()
    : [];

  const industries: FacetNamed[] = industryDocs
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

  const categoryDocs = categoryCounts.size
    ? await Category.find({
        _id: { $in: [...categoryCounts.keys()] },
        status: { $in: ["active", "inactive"] },
        ...(selectedIndustryId ? { industryId: selectedIndustryId } : {}),
      })
        .select("_id name code industryId order")
        .sort({ order: 1 })
        .lean()
    : [];

  const categories: FacetNamed[] = categoryDocs
    .map((d) => ({
      _id: String(d._id),
      name: d.name as { en?: string; ar?: string },
      code: d.code as string | undefined,
      count: categoryCounts.get(String(d._id)) || 0,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count || String(a.name?.en || "").localeCompare(String(b.name?.en || "")));

  let selectedCategoryId = String(opts.categoryId || "");
  // If buyer picked a leaf type, surface its parent as the category selection.
  const selectedLeaf = leaves.find((l) => String(l._id) === selectedCategoryId);
  let selectedTypeId = "";
  if (selectedLeaf?.parentId) {
    selectedTypeId = selectedCategoryId;
    selectedCategoryId = String(selectedLeaf.parentId);
    if (!selectedIndustryId && selectedLeaf.industryId) {
      selectedIndustryId = String(selectedLeaf.industryId);
    }
  } else if (selectedCategoryId && !categories.some((c) => c._id === selectedCategoryId)) {
    // Might be a leaf without parent in map — keep as type
    if (leaves.some((l) => String(l._id) === selectedCategoryId && !l.parentId)) {
      /* L1 leaf acts as category */
    } else if (leaves.some((l) => String(l._id) === selectedCategoryId)) {
      selectedTypeId = selectedCategoryId;
      selectedCategoryId = "";
    } else {
      selectedCategoryId = "";
    }
  }

  const typeDocs = selectedCategoryId
    ? leaves.filter((l) => String(l.parentId || "") === selectedCategoryId)
    : [];

  const productTypes: FacetNamed[] = typeDocs
    .map((d) => ({
      _id: String(d._id),
      name: d.name as { en?: string; ar?: string },
      code: d.code as string | undefined,
      count: typeCounts.get(String(d._id)) || 0,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count || String(a.name?.en || "").localeCompare(String(b.name?.en || "")));

  return {
    industries: toPlain(industries) as FacetNamed[],
    categories: toPlain(categories) as FacetNamed[],
    productTypes: toPlain(productTypes) as FacetNamed[],
    selectedIndustryId,
    selectedCategoryId,
    selectedTypeId,
  };
}
