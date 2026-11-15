import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { Vendor } from "@/modules/vendors/vendor.model";
import { getSession, requireSession } from "@/lib/auth";
import { vendorCompleteness } from "@/modules/products/completeness";
import { Verification, AuditLog } from "@/modules/documents/document.model";
import { AnalyticsEvent } from "@/modules/platform/platform.model";
import { slugifyText } from "@/lib/utils";
import { supplierEditable, cleanDesign, isCrNumber, isVatNumber } from "@/lib/vendor-edit";

export async function GET(req: Request) {
  try {
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const id = sp.get("id");
    const slug = sp.get("slug");

    if (id || slug) {
      const vendor = id
        ? await Vendor.findById(id).lean()
        : await Vendor.findOne({ $or: [{ "slug.en": slug }, { "slug.ar": slug }] }).lean();
      if (!vendor) return fail("Vendor not found", 404);
      await AnalyticsEvent.create({ type: "vendor_view", vendorId: vendor._id });
      return ok(vendor);
    }

    const session = await getSession();
    if (sp.get("mine") === "true") {
      if (!session?.vendorId) return fail("Unauthorized", 401);
      const vendor = await Vendor.findById(session.vendorId).lean();
      return ok(vendor);
    }

    const query: Record<string, unknown> = {};
    const isAdmin =
      session?.roles?.some((r) => ["admin", "super_admin", "vendor_verification_admin"].includes(r)) ?? false;

    if (sp.get("admin") === "1" || sp.get("scope") === "admin") {
      if (!isAdmin) return fail("Forbidden", 403);
      if (sp.get("verificationStatus")) query.verificationStatus = sp.get("verificationStatus");
      if (sp.get("status")) query.status = sp.get("status");
      if (sp.get("q")) {
        const q = sp.get("q")!;
        query.$or = [
          { "legalName.en": new RegExp(q, "i") },
          { "legalName.ar": new RegExp(q, "i") },
          { tradeName: new RegExp(q, "i") },
          { email: new RegExp(q, "i") },
        ];
      }
    } else if (sp.get("status")) {
      query.status = sp.get("status");
    } else {
      query.verificationStatus = { $in: ["verified", "pending"] };
    }
    if (sp.get("city")) query["location.city"] = new RegExp(sp.get("city")!, "i");

    const page = Number(sp.get("page") || 1);
    const limit = Math.min(100, Number(sp.get("limit") || 20));
    const [items, total] = await Promise.all([
      Vendor.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Vendor.countDocuments(query),
    ]);
    return ok({ items, total, page, limit });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession("vendors:edit");
    await connectDB();
    const body = await req.json();
    const vendor = await Vendor.findById(body.id || session.vendorId);
    if (!vendor) return fail("Not found", 404);

    const isAdmin = session.roles.some((r) => ["admin", "super_admin", "vendor_verification_admin"].includes(r));
    if (!isAdmin && String(vendor._id) !== session.vendorId) return fail("Forbidden", 403);

    const prev = vendor.toObject();
    const raw = body.updates && typeof body.updates === "object" ? body.updates : body;
    const { id: _omitId, updates: _omitUpdates, action: _omitAction, ...rest } = raw as Record<string, unknown>;
    // Suppliers edit an allowlist only; status, verification, plan and the live storefront are staff-set.
    const safe = isAdmin ? rest : supplierEditable(rest, vendor.verificationStatus === "verified");
    Object.assign(vendor, safe);
    if (body.storefront) {
      const design = cleanDesign(body.storefront);
      vendor.set("storefront.pending", design);
      vendor.set("storefront.status", "pending");
      vendor.set("storefront.submittedAt", new Date());
      vendor.set("storefront.rejectionReason", "");
    }
    if (safe.legalName || body.updates?.legalName?.en || body.legalName?.en) {
      vendor.slug = vendor.slug || { en: "", ar: "" };
      vendor.slug.en = slugifyText(vendor.legalName?.en || vendor.tradeName || "vendor");
    }
    const completeness = vendorCompleteness(vendor.toObject());
    vendor.completenessScore = completeness.score;
    await vendor.save();

    await AuditLog.create({
      userId: session.id,
      action: "updated",
      entity: "Vendor",
      entityId: String(vendor._id),
      previousValue: prev,
      newValue: vendor.toObject(),
    });

    return ok({ vendor, completeness });
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession("vendors:manage");
    await connectDB();
    const body = await req.json();

    if (body.action === "submit") {
      const vendor = await Vendor.findById(session.vendorId);
      if (!vendor) return fail("Vendor not found", 404);
      // Only unverified or rejected suppliers can (re)apply; verified and suspended stay as staff set them.
      if (!["unverified", "rejected", undefined].includes(vendor.verificationStatus)) return fail("Verification already in progress or decided", 409);
      const cr = String(body.crNumber ?? vendor.crNumber ?? "").replace(/\D/g, "");
      const vat = String(body.vatNumber ?? vendor.vatNumber ?? "").replace(/\D/g, "");
      if (!isCrNumber(cr)) return fail("CR number must be 10 digits", 400);
      if (vat && !isVatNumber(vat)) return fail("VAT number must be 15 digits, starting and ending with 3", 400);
      vendor.crNumber = cr;
      if (vat) vendor.vatNumber = vat;
      vendor.verificationRejectionReason = "";
      vendor.status = "submitted";
      vendor.verificationStatus = "pending";
      await vendor.save();
      await Verification.create({
        entityType: "vendor",
        entityId: vendor._id,
        status: "submitted",
        steps: [{ name: "submitted", status: "done", at: new Date(), by: session.id }],
      });
      return ok(vendor, "Submitted for verification");
    }

    if (body.action === "storefront_review") {
      await requireSession("vendors:approve");
      const vendor = await Vendor.findById(body.id);
      if (!vendor) return fail("Not found", 404);
      if (vendor.storefront?.status !== "pending") return fail("Nothing waiting for review", 409);
      const approve = body.decision === "approve";
      if (!approve && !String(body.reason || "").trim()) return fail("Say what the supplier should change", 400);
      if (approve) vendor.set("storefront.published", vendor.storefront.pending);
      vendor.set("storefront.status", approve ? "approved" : "rejected");
      vendor.set("storefront.reviewedAt", new Date());
      vendor.set("storefront.reviewedBy", session.id);
      vendor.set("storefront.rejectionReason", approve ? "" : String(body.reason).slice(0, 500));
      await vendor.save();
      await AuditLog.create({ userId: session.id, action: approve ? "approved" : "rejected", entity: "VendorStorefront", entityId: String(vendor._id) });
      return ok({ status: vendor.storefront.status });
    }

    if (body.action === "verify") {
      await requireSession("vendors:approve");
      const vendor = await Vendor.findById(body.id);
      if (!vendor) return fail("Not found", 404);
      const nextStatus = body.status || "verified";
      if (["rejected", "suspended"].includes(nextStatus)) {
        if (!String(body.reason || "").trim()) return fail("Give the supplier a reason", 400);
        vendor.verificationRejectionReason = String(body.reason).slice(0, 500);
      } else {
        vendor.verificationRejectionReason = "";
      }
      vendor.verificationReviewedAt = new Date();
      if (nextStatus === "rejected") {
        vendor.status = "rejected";
        vendor.verificationStatus = "rejected";
      } else if (nextStatus === "suspended") {
        vendor.status = "suspended";
        vendor.verificationStatus = "suspended";
      } else {
        vendor.status = "verified";
        vendor.verificationStatus = "verified";
      }
      await vendor.save();
      await Verification.findOneAndUpdate(
        { entityType: "vendor", entityId: vendor._id },
        {
          status:
            nextStatus === "rejected" ? "rejected" : nextStatus === "suspended" ? "suspended" : "approved",
          reviewedBy: session.id,
          $push: { steps: { name: "manual_review", status: "done", at: new Date(), by: session.id } },
        },
        { upsert: true }
      );
      await AuditLog.create({
        userId: session.id,
        action:
          nextStatus === "rejected" ? "rejected" : nextStatus === "suspended" ? "suspended" : "approved",
        entity: "Vendor",
        entityId: String(vendor._id),
      });
      const { onVendorSupplyChanged } = await import("@/modules/seo/pipeline");
      void onVendorSupplyChanged(String(vendor._id)).catch((err) => console.error("[seo-vendor]", err));
      return ok(vendor);
    }

    return fail("Unknown action", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
