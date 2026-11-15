import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { Product } from "@/modules/products/product.model";
import { getSession, requireSession } from "@/lib/auth";
import { productCompleteness } from "@/modules/products/completeness";
import { supplierProductFields, SUPPLIER_STATUSES, REVIEWED_FIELDS } from "@/lib/product-edit";
import { slugifyText } from "@/lib/utils";
import { demoMediaForProduct } from "@/lib/product-visuals";
import { AnalyticsEvent } from "@/modules/platform/platform.model";
import { AuditLog } from "@/modules/documents/document.model";
import { scheduleProductSeoAeo } from "@/modules/seo/pipeline";

export async function GET(req: Request) {
  try {
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const id = sp.get("id");
    const slug = sp.get("slug");

    if (id || slug) {
      // Public vendor fields only: contact details go through the relay, never the product API.
      const PUBLIC_VENDOR = "legalName tradeName slug logo verificationStatus location companyType yearEstablished";
      const product = id
        ? await Product.findById(id).populate("vendorId", PUBLIC_VENDOR).lean()
        : await Product.findOne({ $or: [{ "slug.en": slug }, { "slug.ar": slug }] }).populate("vendorId", PUBLIC_VENDOR).lean();
      if (!product) return fail("Product not found", 404);
      const p = product as { status?: string; vendorId?: { _id?: unknown } };
      if (p.status !== "published") {
        const viewer = await getSession();
        const staff = viewer?.roles?.some((r) => ["admin", "super_admin", "product_admin"].includes(r));
        if (!staff && String(p.vendorId?._id) !== viewer?.vendorId) return fail("Product not found", 404);
      }
      await AnalyticsEvent.create({ type: "product_view", productId: product._id, vendorId: (product as { vendorId?: { _id?: unknown } }).vendorId?._id });
      return ok(product);
    }

    const session = await getSession();
    const mine = sp.get("mine") === "true";
    const query: Record<string, unknown> = {};
    if (mine) {
      if (!session?.vendorId) return fail("Unauthorized", 401);
      query.vendorId = session.vendorId;
      if (sp.get("status") && sp.get("status") !== "all") query.status = sp.get("status");
    } else {
      // Non-published products are visible to staff only.
      const isAdmin = session?.roles?.some((r) => ["admin", "super_admin", "product_admin"].includes(r));
      const wanted = sp.get("status") || "published";
      if (isAdmin) { if (wanted !== "all") query.status = wanted; } else query.status = "published";
    }
    if (sp.get("vendorId")) query.vendorId = sp.get("vendorId");
    if (sp.get("categoryId")) query.categoryId = sp.get("categoryId");

    const page = Number(sp.get("page") || 1);
    const limit = Math.min(100, Number(sp.get("limit") || 20));
    const [items, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("vendorId", "legalName slug verificationStatus logo tradeName").lean(),
      Product.countDocuments(query),
    ]);
    return ok({ items, total, page, limit });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession("products:create");
    if (!session.vendorId && !session.roles.includes("admin") && !session.roles.includes("super_admin")) {
      return fail("Vendor account required", 403);
    }
    await connectDB();
    const raw = await req.json();
    const isAdmin = session.roles.some((r) => ["admin", "super_admin", "product_admin"].includes(r));
    // Suppliers create for their own company only, as a draft or for review; never straight to published.
    const body = isAdmin ? raw : { ...supplierProductFields(raw), status: SUPPLIER_STATUSES.includes(raw.status) ? raw.status : "draft" };
    const vendorId = isAdmin ? raw.vendorId || session.vendorId : session.vendorId;
    if (!vendorId) return fail("vendorId is required", 400);
    const nameEn = body.name?.en || body.nameEn || "Untitled product";
    const completeness = productCompleteness(body);
    const doc = await Product.create({
      ...body,
      vendorId,
      name: body.name || { en: nameEn, ar: body.nameAr || "" },
      slug: body.slug || { en: slugifyText(nameEn), ar: "" },
      // Demo photos only for staff seeding; a supplier's draft shows it has no photo yet.
      media: body.media?.length ? body.media : !isAdmin ? [] : demoMediaForProduct({ sku: body.sku, name: body.name || { en: nameEn, ar: body.nameAr || "" }, brand: body.brand }),
      completenessScore: completeness.score,
      seoReadinessScore: completeness.seoScore,
      status: body.status || "draft",
    });
    scheduleProductSeoAeo(String(doc._id));
    return ok({ product: doc, completeness }, "Product created", 201);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession("products:edit");
    await connectDB();
    const body = await req.json();
    const product = await Product.findById(body.id);
    if (!product) return fail("Not found", 404);

    const isAdmin = session.roles.some((r) => ["admin", "super_admin", "product_admin"].includes(r));
    if (!isAdmin && String(product.vendorId) !== session.vendorId) {
      return fail("Forbidden", 403);
    }

    const prevStatus = product.status;
    const raw = body.updates && typeof body.updates === "object" ? body.updates : body;
    const { id: _omitId, updates: _omitUpdates, action: _omitAction, ...rest } = raw as Record<string, unknown>;
    const safe: Record<string, unknown> = isAdmin ? rest : supplierProductFields(rest);
    Object.assign(product, safe);
    if (!isAdmin) {
      const next = String(rest.status || "");
      if ((SUPPLIER_STATUSES as readonly string[]).includes(next)) product.status = next;
      // A live product stays live after an edit, but moderation gets to look at what changed.
      if (prevStatus === "published" && REVIEWED_FIELDS.some((k) => k in safe)) product.moderationStatus = "needs_review";
    }

    if (isAdmin && (body.action === "approve" || body.status === "published" || safe.status === "published")) {
      await requireSession("products:approve");
      product.status = "published";
    }
    if (isAdmin && (body.action === "reject" || safe.status === "rejected")) {
      await requireSession("products:reject");
      product.status = "rejected";
    }
    if (isAdmin && (body.action === "unpublish" || safe.status === "archived")) {
      await requireSession("products:publish");
      product.status = safe.status === "archived" ? "archived" : "approved";
    }

    const completeness = productCompleteness(product.toObject());
    product.completenessScore = completeness.score;
    product.seoReadinessScore = completeness.seoScore;
    product.version = (product.version || 1) + 1;
    await product.save();

    if (prevStatus !== product.status) {
      await AuditLog.create({
        userId: session.id,
        action: product.status === "published" ? "approved" : product.status === "rejected" ? "rejected" : "updated",
        entity: "Product",
        entityId: String(product._id),
        previousValue: { status: prevStatus },
        newValue: { status: product.status },
      });
    }

    scheduleProductSeoAeo(String(product._id));
    return ok({ product, completeness });
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
