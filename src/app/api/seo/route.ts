import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { Product } from "@/modules/products/product.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Category, Industry } from "@/modules/categories/taxonomy.model";
import { SeoTemplate, SeoRedirect, SeoChangeLog, SeoSettings } from "@/modules/seo/seo.model";
import { generateFromEntity, seoScore } from "@/modules/seo/engine";
import { AuditLog } from "@/modules/documents/document.model";
import { MarketplaceEntity } from "@/modules/seo/entity.model";
import {
  migrateAllSeoEntities,
  mergeMarketplaceEntities,
  processProductSeoAeo,
  refreshOneMarketplaceEntity,
  seedMarketplaceEntities,
} from "@/modules/seo/pipeline";

function loc(v?: { en?: string; ar?: string }) {
  return v?.en || v?.ar || "";
}

export async function GET(req: Request) {
  try {
    await requireSession("seo:view");
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const resource = sp.get("resource") || "dashboard";

    if (resource === "dashboard") {
      const [products, vendors, categories, industries, redirects, marketplace] = await Promise.all([
        Product.find({ status: "published" }).select("name slug seo media").limit(2000).lean(),
        Vendor.find({ verificationStatus: "verified" }).select("legalName slug seo logo").limit(1000).lean(),
        Category.find({ status: "active" }).select("name slug seo").limit(1000).lean(),
        Industry.find({ status: "active" }).select("name slug seo").lean(),
        SeoRedirect.countDocuments({ status: "active" }),
        MarketplaceEntity.find()
          .select("indexable seoScore aeoScore geoScore discoveryScore seoScoreAr seoScoreEn aeoScoreAr aeoScoreEn geoScoreAr geoScoreEn seo name slug lifecycle productCount vendorCount")
          .limit(4000)
          .lean(),
      ]);

      const pages = [
        ...products.map((p) => ({ type: "product", title: loc(p.seo?.title) || loc(p.name), seo: p.seo, slug: p.slug })),
        ...vendors.map((v) => ({ type: "vendor", title: loc(v.seo?.title) || loc(v.legalName), seo: v.seo, slug: v.slug })),
        ...categories.map((c) => ({ type: "category", title: loc(c.seo?.title) || loc(c.name), seo: c.seo, slug: c.slug })),
        ...industries.map((i) => ({ type: "industry", title: loc(i.seo?.title) || loc(i.name), seo: i.seo, slug: i.slug })),
      ];

      const missingTitle = pages.filter((p) => !p.seo?.title?.en && !p.seo?.title?.ar).length;
      const missingDesc = pages.filter((p) => !p.seo?.description?.en && !p.seo?.description?.ar).length;
      const missingCanonical = pages.filter((p) => !p.seo?.canonical).length;
      const noindex = pages.filter((p) => p.seo?.indexable === false).length;
      const titleMap = new Map<string, number>();
      for (const p of pages) {
        const t = (p.seo?.title?.en || p.title || "").toLowerCase().trim();
        if (!t) continue;
        titleMap.set(t, (titleMap.get(t) || 0) + 1);
      }
      const duplicateTitles = [...titleMap.values()].filter((n) => n > 1).length;
      const arabicMissing = pages.filter((p) => !p.seo?.title?.ar && !p.seo?.description?.ar).length;

      return ok({
        totalPublicPages: pages.length + 12,
        indexable: pages.length - noindex,
        noindex,
        missingTitle,
        missingDesc,
        missingCanonical,
        duplicateTitles,
        redirects,
        arabicMissing,
        products: products.length,
        vendors: vendors.length,
        categories: categories.length,
        industries: industries.length,
        productSeoReady: products.filter((p) => p.seo?.title?.en && p.seo?.description?.en).length,
        vendorSeoReady: vendors.filter((v) => v.seo?.title?.en && v.seo?.description?.en).length,
        categorySeoReady: categories.filter((c) => c.seo?.title?.en && c.seo?.description?.en).length,
        marketplaceEntities: marketplace.length,
        marketplaceIndexable: marketplace.filter((e) => e.indexable).length,
        avgSeoScore: marketplace.length
          ? Math.round(marketplace.reduce((s, e) => s + (e.seoScore || 0), 0) / marketplace.length)
          : 0,
        avgAeoScore: marketplace.length
          ? Math.round(marketplace.reduce((s, e) => s + (e.aeoScore || 0), 0) / marketplace.length)
          : 0,
        avgGeoScore: marketplace.length
          ? Math.round(marketplace.reduce((s, e) => s + (e.geoScore || 0), 0) / marketplace.length)
          : 0,
        avgDiscoveryScore: marketplace.length
          ? Math.round(marketplace.reduce((s, e) => s + (e.discoveryScore || 0), 0) / marketplace.length)
          : 0,
        avgSeoAr: marketplace.length
          ? Math.round(marketplace.reduce((s, e) => s + (e.seoScoreAr || 0), 0) / marketplace.length)
          : 0,
        avgSeoEn: marketplace.length
          ? Math.round(marketplace.reduce((s, e) => s + (e.seoScoreEn || 0), 0) / marketplace.length)
          : 0,
        staleEntities: marketplace.filter((e) => e.lifecycle === "unavailable").length,
        emergingEntities: marketplace.filter((e) => e.lifecycle === "emerging").length,
      });
    }

    if (resource === "issues") {
      const products = await Product.find({ status: "published" }).select("name slug seo sku").limit(500).lean();
      const issues: { severity: string; entity: string; name: string; problem: string }[] = [];
      for (const p of products) {
        const name = loc(p.name) || String(p._id);
        if (!p.seo?.title?.en) issues.push({ severity: "critical", entity: "product", name, problem: "Missing SEO title" });
        if (!p.seo?.description?.en) issues.push({ severity: "warning", entity: "product", name, problem: "Missing meta description" });
        if (!p.seo?.canonical) issues.push({ severity: "warning", entity: "product", name, problem: "Missing canonical" });
        if (p.seo?.indexable === false) issues.push({ severity: "critical", entity: "product", name, problem: "Published product is noindex" });
        if (!p.seo?.title?.ar) issues.push({ severity: "warning", entity: "product", name, problem: "Missing Arabic title" });
      }
      return ok({ issues: issues.slice(0, 200), total: issues.length });
    }

    if (resource === "duplicates") {
      const products = await Product.find({ status: "published" }).select("name slug seo").limit(1000).lean();
      const map = new Map<string, { id: string; name: string }[]>();
      for (const p of products) {
        const t = (p.seo?.title?.en || loc(p.name)).toLowerCase().trim();
        if (!t) continue;
        const arr = map.get(t) || [];
        arr.push({ id: String(p._id), name: loc(p.name) });
        map.set(t, arr);
      }
      const dups = [...map.entries()]
        .filter(([, v]) => v.length > 1)
        .map(([title, pages]) => ({ conflict: "duplicate_title", title, pages, action: "Differentiate titles or set a canonical" }));
      return ok(dups);
    }

    if (resource === "templates") {
      const items = await SeoTemplate.find().sort({ entityType: 1 }).lean();
      return ok(items);
    }

    if (resource === "redirects") {
      const items = await SeoRedirect.find().sort({ createdAt: -1 }).limit(200).lean();
      return ok(items);
    }

    if (resource === "settings") {
      const row = await SeoSettings.findOne({ key: "default" }).lean();
      return ok(row || { key: "default", robotsTxt: "", siteName: "Humuk" });
    }

    if (resource === "history") {
      const items = await SeoChangeLog.find().sort({ createdAt: -1 }).limit(100).lean();
      return ok(items);
    }

    if (resource === "entities") {
      const type = sp.get("type") || "product";
      if (type === "product") {
        const items = await Product.find().select("name slug seo status sku").sort({ updatedAt: -1 }).limit(80).lean();
        return ok(
          items.map((p) => ({
            id: String(p._id),
            type: "product",
            name: loc(p.name),
            slug: p.slug?.en,
            status: p.status,
            seo: p.seo,
            score: seoScore({
              title: Boolean(p.seo?.title?.en),
              description: Boolean(p.seo?.description?.en),
              canonical: Boolean(p.seo?.canonical),
              ar: Boolean(p.seo?.title?.ar),
              index: p.seo?.indexable !== false,
            }),
          }))
        );
      }
      if (type === "vendor") {
        const items = await Vendor.find().select("legalName slug seo verificationStatus").sort({ updatedAt: -1 }).limit(80).lean();
        return ok(
          items.map((v) => ({
            id: String(v._id),
            type: "vendor",
            name: loc(v.legalName),
            slug: v.slug?.en,
            status: v.verificationStatus,
            seo: v.seo,
            score: seoScore({
              title: Boolean(v.seo?.title?.en),
              description: Boolean(v.seo?.description?.en),
              canonical: Boolean(v.seo?.canonical),
              ar: Boolean(v.seo?.title?.ar),
            }),
          }))
        );
      }
      if (type === "category") {
        const items = await Category.find().select("name slug seo status").sort({ order: 1 }).limit(120).lean();
        return ok(
          items.map((c) => ({
            id: String(c._id),
            type: "category",
            name: loc(c.name),
            slug: c.slug?.en,
            status: c.status,
            seo: c.seo,
            score: seoScore({ title: Boolean(c.seo?.title?.en), description: Boolean(c.seo?.description?.en) }),
          }))
        );
      }
      if (type === "marketplace") {
        const items = await MarketplaceEntity.find().sort({ seoScore: -1, productCount: -1 }).limit(200).lean();
        return ok(
          items.map((e) => ({
            id: String(e._id),
            type: "marketplace",
            key: e.key,
            kind: e.kind,
            name: loc(e.name),
            slug: e.slug,
            status: e.lifecycle,
            indexable: e.indexable,
            products: e.productCount,
            vendors: e.vendorCount,
            seo: e.seo,
            score: e.seoScore,
            aeoScore: e.aeoScore,
            geoScore: e.geoScore,
            discoveryScore: e.discoveryScore,
            seoScoreAr: e.seoScoreAr,
            seoScoreEn: e.seoScoreEn,
            aeoScoreAr: e.aeoScoreAr,
            aeoScoreEn: e.aeoScoreEn,
            arabic: Boolean(e.seo?.title?.ar || e.name?.ar),
            nameAr: e.name?.ar,
          }))
        );
      }
    }

    return fail("Unknown resource", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession("seo:edit");
    await connectDB();
    const body = await req.json();
    const action = body.action as string;

    if (action === "generate") {
      const { entityType, id } = body as { entityType: string; id: string };
      if (entityType === "product") {
        const p = await Product.findById(id);
        if (!p) return fail("Not found", 404);
        const prev = p.seo;
        const gen = generateFromEntity("product", "en", {
          name: p.name?.en,
          brand: p.brand,
          brandPhrase: p.brand ? ` from ${p.brand}` : "",
        });
        const genAr = generateFromEntity("product", "ar", {
          name: p.name?.ar || p.name?.en,
          brand: p.brand,
          brandPhrase: p.brand ? ` من ${p.brand}` : "",
        });
        p.seo = {
          ...(p.seo?.toObject?.() || p.seo || {}),
          title: { en: gen.title, ar: genAr.title },
          description: { en: gen.description, ar: genAr.description },
          h1: { en: gen.h1, ar: genAr.h1 },
          ogTitle: { en: gen.title, ar: genAr.title },
          ogDescription: { en: gen.description, ar: genAr.description },
          canonical: p.seo?.canonical || `/en/products/${p.slug?.en || p._id}`,
          indexable: p.seo?.indexable !== false,
          sitemapInclude: true,
        };
        await p.save();
        void processProductSeoAeo(String(p._id)).catch(() => undefined);
        await SeoChangeLog.create({
          entityType: "product",
          entityId: String(p._id),
          field: "seo",
          previousValue: prev,
          newValue: p.seo,
          source: "ai",
          userId: session.id,
          reason: "generate",
        });
        return ok(p.seo);
      }
      if (entityType === "vendor") {
        const v = await Vendor.findById(id);
        if (!v) return fail("Not found", 404);
        const prev = v.seo;
        const typePhraseEn = v.companyType ? v.companyType.replace(/_/g, " ") : "supplier";
        const typePhraseAr = v.companyType ? v.companyType.replace(/_/g, " ") : "مورد";
        const locCity = v.location?.city;
        const gen = generateFromEntity("vendor", "en", {
          name: v.legalName?.en || v.tradeName,
          typePhrase: typePhraseEn,
          locationPhrase: locCity ? ` in ${locCity}` : "",
        });
        const genAr = generateFromEntity("vendor", "ar", {
          name: v.legalName?.ar || v.legalName?.en || v.tradeName,
          typePhrase: typePhraseAr,
          locationPhrase: locCity ? ` في ${locCity}` : "",
        });
        v.seo = {
          ...(v.seo?.toObject?.() || v.seo || {}),
          title: { en: gen.title, ar: genAr.title },
          description: { en: gen.description, ar: genAr.description },
          h1: { en: gen.h1, ar: genAr.h1 },
          ogTitle: { en: gen.title, ar: genAr.title },
          ogDescription: { en: gen.description, ar: genAr.description },
          canonical: `/en/vendors/${v.slug?.en || v._id}`,
          indexable: v.verificationStatus === "verified",
          sitemapInclude: v.verificationStatus === "verified",
        };
        await v.save();
        await SeoChangeLog.create({
          entityType: "vendor",
          entityId: String(v._id),
          field: "seo",
          previousValue: prev,
          newValue: v.seo,
          source: "ai",
          userId: session.id,
          reason: "generate",
        });
        return ok(v.seo);
      }
      if (entityType === "category") {
        const c = await Category.findById(id);
        if (!c) return fail("Not found", 404);
        const gen = generateFromEntity("category", "en", { name: c.name?.en });
        const genAr = generateFromEntity("category", "ar", { name: c.name?.ar || c.name?.en });
        c.seo = {
          ...(c.seo?.toObject?.() || c.seo || {}),
          title: { en: gen.title, ar: genAr.title },
          description: { en: gen.description, ar: genAr.description },
          h1: { en: gen.h1, ar: genAr.h1 },
          canonical: `/en/c/${c.slug?.en || c.catalogKey || c._id}`,
          indexable: true,
          sitemapInclude: true,
        };
        await c.save();
        return ok(c.seo);
      }
      return fail("Unsupported entity", 400);
    }

    if (action === "bulk-generate") {
      const { entityType, ids } = body as { entityType: string; ids: string[] };
      if (!Array.isArray(ids) || ids.length === 0) return fail("ids required", 400);
      let count = 0;
      for (const id of ids.slice(0, 50)) {
        const res = await POST(
          new Request(req.url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "generate", entityType, id }),
          })
        );
        if (res.ok) count += 1;
      }
      await AuditLog.create({
        userId: session.id,
        action: "seo_bulk_generate",
        entity: entityType,
        entityId: ids.join(","),
        newValue: { count },
      });
      return ok({ count });
    }

    if (action === "save-seo") {
      const { entityType, id, seo } = body;
      if (entityType === "product") {
        const p = await Product.findByIdAndUpdate(id, { seo }, { new: true });
        return ok(p?.seo);
      }
      if (entityType === "vendor") {
        const v = await Vendor.findByIdAndUpdate(id, { seo }, { new: true });
        return ok(v?.seo);
      }
      if (entityType === "category") {
        const c = await Category.findByIdAndUpdate(id, { seo }, { new: true });
        return ok(c?.seo);
      }
    }

    if (action === "redirect") {
      const row = await SeoRedirect.create({
        fromPath: body.fromPath,
        toPath: body.toPath,
        type: body.type || 301,
        entityType: body.entityType,
        entityId: body.entityId,
        createdBy: session.id,
        status: "active",
      });
      return ok(row);
    }

    if (action === "settings") {
      const row = await SeoSettings.findOneAndUpdate(
        { key: "default" },
        { $set: { ...body.updates, key: "default" } },
        { upsert: true, new: true }
      );
      return ok(row);
    }

    if (action === "template") {
      const row = await SeoTemplate.findOneAndUpdate(
        { key: body.key },
        { $set: body },
        { upsert: true, new: true }
      );
      return ok(row);
    }

    if (action === "save-entity") {
      const row = await MarketplaceEntity.findById(body.id);
      if (!row) return fail("Not found", 404);
      const prevSlug = row.slug;
      if (body.updates?.slug && body.updates.slug !== prevSlug) {
        await SeoRedirect.create({
          fromPath: `/en/c/${prevSlug}`,
          toPath: `/en/c/${body.updates.slug}`,
          type: 301,
          entityType: "marketplace",
          entityId: String(row._id),
          createdBy: session.id,
          status: "active",
        });
        await SeoRedirect.create({
          fromPath: `/ar/c/${prevSlug}`,
          toPath: `/ar/c/${body.updates.slug}`,
          type: 301,
          entityType: "marketplace",
          entityId: String(row._id),
          createdBy: session.id,
          status: "active",
        });
      }
      Object.assign(row, body.updates || {});
      if (body.updates?.seo) row.seo = { ...(row.seo?.toObject?.() || row.seo || {}), ...body.updates.seo };
      if (typeof body.updates?.indexableOverride === "boolean") {
        row.indexableOverride = body.updates.indexableOverride;
        row.indexable = body.updates.indexableOverride;
      }
      await row.save();
      await refreshOneMarketplaceEntity(String(row._id));
      await SeoChangeLog.create({
        entityType: "marketplace",
        entityId: String(row._id),
        field: "entity",
        previousValue: { slug: prevSlug },
        newValue: body.updates,
        source: "manual",
        userId: session.id,
        reason: body.reason || "admin override",
      });
      return ok(row);
    }

    if (action === "seed-entities") {
      await seedMarketplaceEntities();
      return ok({ ok: true });
    }

    if (action === "migrate-entities") {
      const report = await migrateAllSeoEntities(Number(body.limit) || 2000);
      await AuditLog.create({
        userId: session.id,
        action: "seo_migrate_entities",
        entity: "MarketplaceEntity",
        entityId: "bulk",
        newValue: report,
      });
      return ok(report);
    }

    if (action === "run-pipeline") {
      if (!body.id) return fail("id required", 400);
      const result = await processProductSeoAeo(String(body.id));
      return ok(result);
    }

    if (action === "merge-entities") {
      const result = await mergeMarketplaceEntities(body.fromKey, body.toKey, session.id);
      await AuditLog.create({
        userId: session.id,
        action: "seo_merge_entities",
        entity: "MarketplaceEntity",
        entityId: `${body.fromKey}->${body.toKey}`,
      });
      return ok(result);
    }

    if (action === "recompute-entity") {
      const row = await refreshOneMarketplaceEntity(String(body.id));
      return ok(row);
    }

    return fail("Unknown action", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
