export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Product } from "@/modules/products/product.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Category, Industry } from "@/modules/categories/taxonomy.model";
import { MarketplaceEntity } from "@/modules/seo/entity.model";
import { siteOrigin } from "@/modules/seo/engine";
import { ALL_MARKETPLACE_SECTORS } from "@/data/marketplace-sectors";

function alt(path: string) {
  const base = siteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  const clean = p === "/" ? "" : p;
  return {
    languages: {
      "en-SA": `${base}/en${clean}`,
      "ar-SA": `${base}/ar${clean}`,
      en: `${base}/en${clean}`,
      ar: `${base}/ar${clean}`,
      "x-default": `${base}/en${clean}`,
    },
  };
}

function entry(
  path: string,
  opts?: { lastModified?: Date; changeFrequency?: MetadataRoute.Sitemap[0]["changeFrequency"]; priority?: number }
): MetadataRoute.Sitemap[0] {
  const base = siteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  const clean = p === "/" ? "" : p;
  return {
    url: `${base}/en${clean}`,
    lastModified: opts?.lastModified || new Date(),
    changeFrequency: opts?.changeFrequency || "weekly",
    priority: opts?.priority ?? 0.7,
    alternates: alt(clean || "/"),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/categories",
    "/products",
    "/vendors",
    "/vendors/cities",
    "/vendors/brands",
    "/vendors/manufacturers",
    "/vendors/made-in-saudi",
    "/industries",
    "/request-quotes",
    "/rfq",
    "/sourcing-help",
    "/upload-boq",
    "/how-it-works",
    "/verification",
    "/become-a-vendor",
    "/about",
    "/contact",
    "/faq",
    "/help",
    "/report",
    "/blog",
    "/terms",
    "/privacy",
    "/marketplace-rules",
    "/compare",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) =>
    entry(path || "/", { priority: path === "" ? 1 : 0.7, changeFrequency: path === "" ? "daily" : "weekly" })
  );

  for (const sector of ALL_MARKETPLACE_SECTORS) {
    entries.push(entry(`/categories/${sector.slug}`, { priority: 0.75 }));
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
      Category.find({ status: { $ne: "archived" } })
        .select("slug catalogKey updatedAt seo")
        .limit(2000)
        .lean(),
      MarketplaceEntity.find({ indexable: true, "seo.sitemapInclude": { $ne: false } })
        .select("slug updatedAt seo")
        .limit(4000)
        .lean(),
    ]);

    for (const p of products) {
      if (p.seo?.sitemapInclude === false) continue;
      const slug = p.slug?.en || String(p._id);
      entries.push(
        entry(`/products/${slug}`, {
          lastModified: p.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        })
      );
    }
    for (const v of vendors) {
      if (v.seo?.sitemapInclude === false) continue;
      const slug = v.slug?.en || String(v._id);
      entries.push(
        entry(`/vendors/${slug}`, {
          lastModified: v.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        })
      );
    }
    for (const i of industries) {
      const slug = i.slug?.en || String(i._id);
      entries.push(entry(`/industries/${slug}`, { lastModified: i.updatedAt, priority: 0.6 }));
    }
    for (const c of categories) {
      if (c.seo?.sitemapInclude === false) continue;
      const key = c.catalogKey || c.slug?.en || String(c._id);
      entries.push(
        entry(`/c/${c.slug?.en || key}`, {
          lastModified: c.updatedAt,
          priority: 0.65,
        })
      );
    }
    for (const e of entities) {
      if (e.seo?.sitemapInclude === false) continue;
      entries.push(
        entry(`/c/${e.slug}`, {
          lastModified: e.updatedAt,
          changeFrequency: "weekly",
          priority: 0.85,
        })
      );
    }
  } catch {
    /* DB offline — static URLs only */
  }

  return entries;
}
