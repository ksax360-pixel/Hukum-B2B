import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireSession, getSession } from "@/lib/auth";
import {
  CMSPage,
  SubscriptionPlan,
  Review,
  SavedProduct,
  SavedVendor,
  Location,
  SystemSetting,
} from "@/modules/platform/platform.model";
import { getPaymentProvider } from "@/modules/payments/provider";
import { Payment } from "@/modules/platform/platform.model";

export async function GET(req: Request) {
  try {
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const resource = sp.get("resource");

    if (resource === "cms") {
      const type = sp.get("type");
      const q: Record<string, unknown> = {};
      if (sp.get("admin") === "1") {
        await requireSession("cms:view");
      } else {
        q.status = "published";
      }
      if (type) q.type = type;
      return ok(await CMSPage.find(q).sort({ createdAt: -1 }).lean());
    }
    if (resource === "plans") {
      return ok(await SubscriptionPlan.find({ status: "active" }).lean());
    }
    if (resource === "locations") {
      return ok(await Location.find({ status: "active" }).lean());
    }
    if (resource === "settings") {
      await requireSession("settings:view");
      return ok(await SystemSetting.find().lean());
    }
    if (resource === "reviews") {
      const q: Record<string, unknown> = { moderationStatus: "approved" };
      if (sp.get("targetId")) q.targetId = sp.get("targetId");
      return ok(await Review.find(q).lean());
    }
    if (resource === "saved") {
      const session = await getSession();
      if (!session) return fail("Unauthorized", 401);
      // Public fields only: supplier contact goes through the relay, never through saved items.
      const products = await SavedProduct.find({ userId: session.id }).populate({ path: "productId", match: { status: "published" }, select: "name slug media price unit moq leadTime brand vendorId", populate: { path: "vendorId", select: "legalName tradeName slug verificationStatus location logo" } }).lean();
      const vendors = await SavedVendor.find({ userId: session.id }).populate("vendorId", "legalName tradeName slug verificationStatus location logo companyType").lean();
      return ok({ products, vendors });
    }
    return fail("Unknown resource", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (body.action === "save_product") {
      const session = await requireSession("products:view");
      const doc = await SavedProduct.findOneAndUpdate(
        { userId: session.id, productId: body.productId },
        { userId: session.id, productId: body.productId },
        { upsert: true, new: true }
      );
      return ok(doc);
    }
    if (body.action === "unsave_product" || body.action === "unsave_vendor") {
      const session = await requireSession("products:view");
      const isProduct = body.action === "unsave_product";
      const id = String(isProduct ? body.productId : body.vendorId || "");
      if (!/^[a-f\d]{24}$/i.test(id)) return fail("Invalid id", 400);
      await (isProduct ? SavedProduct.deleteOne({ userId: session.id, productId: id }) : SavedVendor.deleteOne({ userId: session.id, vendorId: id }));
      return ok(null, "Removed");
    }
    if (body.action === "save_vendor") {
      const session = await requireSession("vendors:view");
      const doc = await SavedVendor.findOneAndUpdate(
        { userId: session.id, vendorId: body.vendorId },
        { userId: session.id, vendorId: body.vendorId },
        { upsert: true, new: true }
      );
      return ok(doc);
    }
    if (body.action === "review") {
      const session = await requireSession("products:view");
      const doc = await Review.create({
        targetType: body.targetType,
        targetId: body.targetId,
        authorId: session.id,
        rating: body.rating,
        comment: body.comment,
        moderationStatus: "pending",
      });
      return ok(doc, "Review submitted for moderation", 201);
    }
    if (body.action === "checkout") {
      const session = await requireSession("subscriptions:view");
      const provider = getPaymentProvider();
      if (!provider.isConfigured()) return fail("Payment provider not configured", 503);
      const checkout = await provider.createCheckout({
        amount: body.amount,
        currency: body.currency || "SAR",
        customerId: session.id,
        meta: body.meta,
      });
      await Payment.create({
        customerId: session.id,
        vendorId: session.vendorId,
        amount: body.amount,
        currency: body.currency || "SAR",
        provider: provider.name,
        providerRef: checkout.providerRef,
        status: "pending",
      });
      return ok(checkout);
    }
    if (body.action === "cms_upsert") {
      await requireSession("cms:edit");
      const doc = body.id
        ? await CMSPage.findByIdAndUpdate(body.id, body.updates, { new: true })
        : await CMSPage.create(body.updates || body);
      return ok(doc);
    }
    if (body.action === "plan_upsert") {
      await requireSession("subscriptions:manage");
      const doc = await SubscriptionPlan.findOneAndUpdate({ key: body.key }, body, { upsert: true, new: true });
      return ok(doc);
    }
    if (body.action === "setting") {
      await requireSession("settings:configure");
      const doc = await SystemSetting.findOneAndUpdate({ key: body.key }, { value: body.value }, { upsert: true, new: true });
      return ok(doc);
    }
    return fail("Unknown action", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
