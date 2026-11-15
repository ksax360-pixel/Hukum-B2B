import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { findEntityBySlug, seedMarketplaceEntities } from "@/modules/seo/pipeline";
import { matchCatalogFromText } from "@/modules/seo/catalog-resolve";
import { parseSearchQuery } from "@/modules/seo/intent";
import { pickAeo } from "@/modules/seo/aeo";
import { pickGeo } from "@/modules/seo/geo";
import { expandSearchQuery, resolveSynonymCategoryKeys } from "@/data/controlled-vocabularies";
import { MarketplaceEntity } from "@/modules/seo/entity.model";

/**
 * Machine-readable knowledge layer for AEO / GEO / LLM discovery.
 * Returns verified entity facts only — never invents commercial claims.
 */
export async function GET(req: Request) {
  try {
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const slug = sp.get("slug") || "";
    const q = sp.get("q") || "";
    const locale = sp.get("locale") === "en" ? "en" : "ar";

    await seedMarketplaceEntities();

    if (q) {
      const expanded = expandSearchQuery(q);
      const catalogKeys = resolveSynonymCategoryKeys(q);
      const hit = matchCatalogFromText(q);
      const parsed = parseSearchQuery(q, hit ? [hit.child?.key || hit.category.key, ...catalogKeys] : catalogKeys);
      let entity = hit
        ? await MarketplaceEntity.findOne({
            $or: [{ key: hit.child?.key || hit.category.key }, { catalogKey: hit.category.key }, { slug: hit.category.slug.en }],
          }).lean()
        : null;
      if (!entity && catalogKeys[0]) {
        entity = await MarketplaceEntity.findOne({ catalogKey: catalogKeys[0], kind: { $in: ["category", "product_type"] } }).lean();
      }
      return ok({
        query: parsed,
        expandedTerms: expanded,
        resolvedEntity: entity
          ? {
              key: entity.key,
              slug: entity.slug,
              name: entity.name,
              intent: entity.intent,
              path: `/${locale}/c/${entity.slug}`,
              productCount: entity.productCount,
              vendorCount: entity.vendorCount,
              indexable: entity.indexable,
              summary: pickAeo(locale, entity.aeo?.summary),
              entityCard: pickGeo(locale, entity.geo?.entityCard),
              claims: ((entity.geo?.claims || []) as { key?: string; statement?: { en?: string; ar?: string } }[])
                .slice(0, 12)
                .map((c) => ({
                  key: c.key,
                  statement: pickGeo(locale, c.statement),
                })),
              faqs: ((entity.aeo?.faqs || []) as { q?: { en?: string; ar?: string }; a?: { en?: string; ar?: string } }[])
                .slice(0, 8)
                .map((f) => ({ q: pickAeo(locale, f.q), a: pickAeo(locale, f.a) })),
            }
          : null,
        unavailableNote:
          locale === "ar"
            ? "لا تُنشأ إجابات عن أسعار أو شهادات أو سعات إنتاج غير موجودة في بيانات Humuk."
            : "Answers are not invented for prices, certifications, or capacity missing from Humuk data.",
      });
    }

    if (!slug) return fail("slug or q required", 400);
    const entity = await findEntityBySlug(slug);
    if (!entity) return fail("Not found", 404);

    return ok({
      key: entity.key,
      kind: entity.kind,
      slug: entity.slug,
      name: entity.name,
      intro: entity.intro,
      synonyms: entity.synonyms,
      lifecycle: entity.lifecycle,
      intent: entity.intent,
      productCount: entity.productCount,
      vendorCount: entity.vendorCount,
      manufacturerCount: entity.manufacturerCount,
      indexable: entity.indexable,
      scores: {
        seoAr: entity.seoScoreAr,
        seoEn: entity.seoScoreEn,
        aeoAr: entity.aeoScoreAr,
        aeoEn: entity.aeoScoreEn,
        geoAr: entity.geoScoreAr,
        geoEn: entity.geoScoreEn,
        discovery: entity.discoveryScore,
      },
      summary: pickAeo(locale, entity.aeo?.summary),
      entityCard: pickGeo(locale, entity.geo?.entityCard),
      attribution: pickGeo(locale, entity.geo?.attribution),
      facts: ((entity.aeo?.facts || []) as { key?: string; label?: { en?: string; ar?: string }; value?: { en?: string; ar?: string } }[]).map(
        (f) => ({
          key: f.key,
          label: pickAeo(locale, f.label),
          value: pickAeo(locale, f.value),
        })
      ),
      claims: ((entity.geo?.claims || []) as { key?: string; statement?: { en?: string; ar?: string }; freshness?: string }[]).map((c) => ({
        key: c.key,
        statement: pickGeo(locale, c.statement),
        freshness: c.freshness,
      })),
      faqs: ((entity.aeo?.faqs || []) as { q?: { en?: string; ar?: string }; a?: { en?: string; ar?: string } }[]).map((f) => ({
        q: pickAeo(locale, f.q),
        a: pickAeo(locale, f.a),
      })),
      paths: {
        ar: `/ar/c/${entity.slug}`,
        en: `/en/c/${entity.slug}`,
      },
    });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
