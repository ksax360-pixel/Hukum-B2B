import { UNITS } from "@/lib/schemas/common";
import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { Product } from "@/modules/products/product.model";
import Papa from "papaparse";
import { productCompleteness } from "@/modules/products/completeness";
import { slugifyText } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const session = await requireSession("products:export");
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const query: Record<string, unknown> = {};
    if (session.vendorId && !session.roles.includes("admin")) query.vendorId = session.vendorId;
    const products = await Product.find(query).limit(5000).lean();
    const rows = products.map((p) => ({
      sku: p.sku,
      name_en: p.name?.en,
      name_ar: p.name?.ar,
      brand: p.brand,
      price: p.price,
      currency: p.currency,
      moq: p.moq,
      status: p.status,
    }));
    if (sp.get("format") === "json") return ok(rows);
    const csv = Papa.unparse(rows);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=products.csv",
      },
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession("products:create");
    if (!session.vendorId) return fail("Vendor required", 403);
    await connectDB();
    const body = await req.json();
    const rows = body.rows as Array<Record<string, string>>;
    if (!Array.isArray(rows)) return fail("rows array required", 400);
    if (rows.length > 500) return fail("Up to 500 products per upload", 413);

    const report = { uploaded: rows.length, valid: 0, missingFields: 0, duplicates: 0, categoryMismatches: 0, created: 0 };
    const created = [];

    for (const row of rows) {
      if (!row.name_en && !row.name_ar && !row.sku) {
        report.missingFields++;
        continue;
      }
      if (row.sku) {
        const dup = await Product.findOne({ vendorId: session.vendorId, sku: row.sku });
        if (dup) {
          report.duplicates++;
          continue;
        }
      }
      const payload = {
        vendorId: session.vendorId,
        sku: row.sku,
        name: { en: row.name_en || "", ar: row.name_ar || "" },
        description: { en: row.description_en || "", ar: row.description_ar || "" },
        brand: row.brand,
        price: row.price ? Number(row.price) : undefined,
        currency: row.currency || "SAR",
        moq: row.moq ? Number(row.moq) : undefined,
        ...((UNITS as readonly string[]).includes(row.unit) ? { unit: row.unit } : {}),
        priceType: Number(row.price) > 0 ? "starting_from" : "price_on_request",
        status: "draft",
        slug: { en: `${slugifyText(row.name_en || row.sku || "product")}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, ar: "" },
      };
      const completeness = productCompleteness(payload);
      const doc = await Product.create({
        ...payload,
        completenessScore: completeness.score,
        seoReadinessScore: completeness.seoScore,
      });
      created.push(doc);
      report.valid++;
      report.created++;
    }

    return ok({ report, createdIds: created.map((c) => c._id) }, "Bulk import processed — review drafts before publish");
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
