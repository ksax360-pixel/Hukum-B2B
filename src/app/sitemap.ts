export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/db";
import { Product } from "@/modules/products/product.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Category, Industry } from "@/modules/categories/taxonomy.model";
import { MarketplaceEntity } from "@/modules/seo/entity.model";
import { siteOrigin } from "@/modules/seo/engine";

export default async function sitemap() {
  const base = siteOrigin();
  const staticPaths = [
    "",
    "/products",
    "/vendors",
    "/categories",
    "/industries",
    "/about",
    "/contact",
    "/blog",
    "/faq",
  ];
  const entries: { url: string; lastModified?: Date; changeFrequency?: "weekly" | "daily"; priority?: number }[] = [];

  for (const locale of ["en", "ar"] as const) {
    for (const path of staticPaths) {
      entries.push({
        url: `${base}/${locale}${path}`,
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.7,
      });
    }
  }

  try {
    await connectDB();
    const [products, vendors, industries, categories, entities] = await Promise.all([
      Product.find({ status: "published", "seo.indexable": { $ne: false } })
        .select("slug updatedAt seo")
        .limit(5000)
        .lean(),
      Vendor.find({ verificationStatus: "verified", "seo.indexable": { $ne: false } })
        .select("slug updatedAt seo")
        .limit(2000)
        .lean(),
      Industry.find({ status: "active" }).select("slug updatedAt").lean(),
      Category.find({ status: { $ne: "archived" } }).select("slug catalogKey updatedAt seo").limit(2000).lean(),
      MarketplaceEntity.find({ indexable: true, "seo.sitemapInclude": { $ne: false } })
        .select("slug updatedAt seo")
        .limit(4000)
        .lean(),
    ]);
    for (const locale of ["en", "ar"] as const) {
      for (const p of products) {
        if (p.seo?.sitemapInclude === false) continue;
        const slug = (locale === "ar" ? p.slug?.ar : p.slug?.en) || p.slug?.en || String(p._id);
        entries.push({ url: `${base}/${locale}/products/${slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.8 });
      }
      for (const v of vendors) {
        if (v.seo?.sitemapInclude === false) continue;
        const slug = (locale === "ar" ? v.slug?.ar : v.slug?.en) || v.slug?.en || String(v._id);
        entries.push({ url: `${base}/${locale}/vendors/${slug}`, lastModified: v.updatedAt, changeFrequency: "weekly", priority: 0.7 });
      }
      for (const i of industries) {
        const slug = i.slug?.en || String(i._id);
        entries.push({ url: `${base}/${locale}/industries/${slug}`, lastModified: i.updatedAt, priority: 0.6 });
      }
      for (const c of categories) {
        if (c.seo?.sitemapInclude === false) continue;
        const key = c.catalogKey || c.slug?.en || String(c._id);
        entries.push({ url: `${base}/${locale}/c/${c.slug?.en || key}`, lastModified: c.updatedAt, priority: 0.6 });
      }
      for (const e of entities) {
        if (e.seo?.sitemapInclude === false) continue;
        entries.push({ url: `${base}/${locale}/c/${e.slug}`, lastModified: e.updatedAt, changeFrequency: "weekly", priority: 0.85 });
      }
    }
  } catch {
    /* DB offline — static URLs only */
  }

  return entries;
}
