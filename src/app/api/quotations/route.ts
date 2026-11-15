import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { RFQ, Quotation, RFQVendor } from "@/modules/rfqs/rfq.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { requireSession } from "@/lib/auth";

type Session = Awaited<ReturnType<typeof requireSession>>;
const STAFF = ["admin", "super_admin", "platform_admin"];
const OPEN = ["submitted", "revised", "clarifying", "shortlisted"];
const ACCEPTED = ["accepted", "deal_confirmed", "reviewed"];
const PUBLIC_VENDOR = "legalName tradeName slug verificationStatus location";
const isStaff = (s: Session): boolean => s.roles.some((r) => STAFF.includes(r));
const validId = (v: unknown): v is string => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);

/** Quotes are visible to the supplier who wrote them, the buyer who asked, and staff. Nobody else. */
export async function GET(req: Request) {
  try {
    const session = await requireSession("quotations:view");
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const id = sp.get("id");

    if (id) {
      if (!validId(id)) return fail("Not found", 404);
      const q = (await Quotation.findById(id).populate("vendorId", PUBLIC_VENDOR).populate("rfqId", "title status deadline buyerId").lean()) as
        | (Record<string, unknown> & { status?: string; vendorId?: { _id?: unknown }; rfqId?: { buyerId?: unknown } })
        | null;
      if (!q) return fail("Not found", 404);
      const isBuyer = String(q.rfqId?.buyerId) === session.id;
      const isSupplier = String(q.vendorId?._id) === session.vendorId;
      if (!isBuyer && !isSupplier && !isStaff(session)) return fail("Not found", 404);
      // The buyer gets the supplier's contact once they accept; until then first contact goes through the relay.
      let contact: Record<string, string> | undefined;
      if (isBuyer && ACCEPTED.includes(q.status || "")) {
        const v = (await Vendor.findById(q.vendorId?._id).select("phone email whatsapp legalName tradeName").lean()) as { phone?: string; email?: string; whatsapp?: string; tradeName?: string; legalName?: { en?: string } } | null;
        contact = { phone: v?.phone || "", email: v?.email || "", whatsapp: v?.whatsapp || "", company: v?.tradeName || v?.legalName?.en || "" };
      }
      const { rfqId, ...rest } = q as Record<string, unknown> & { rfqId?: { buyerId?: unknown } };
      const { buyerId: _b, ...rfqPublic } = (rfqId || {}) as Record<string, unknown>;
      return ok({ ...rest, rfqId: rfqPublic, contact });
    }

    const query: Record<string, unknown> = {};
    const rfqId = sp.get("rfqId");
    if (rfqId) {
      if (!validId(rfqId)) return ok([]);
      query.rfqId = rfqId;
    }
    if (sp.get("scope") === "vendor" && session.vendorId) {
      query.vendorId = session.vendorId;
    } else if (!isStaff(session)) {
      const mine = await RFQ.find({ buyerId: session.id }).select("_id").lean();
      const ids = mine.map((r) => (r as { _id: unknown })._id);
      query.rfqId = rfqId ? (ids.some((x) => String(x) === rfqId) ? rfqId : { $in: [] }) : { $in: ids };
    }
    const items = await Quotation.find({ ...query, status: { $ne: "draft" } })
      .populate("vendorId", PUBLIC_VENDOR)
      .populate("rfqId", "title status deadline")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    return ok(items);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : Number(v) >= 0 ? Number(v) : 0);

export async function POST(req: Request) {
  try {
    const session = await requireSession("quotations:create");
    if (!session.vendorId) return fail("Vendor required", 403);
    await connectDB();
    const body = await req.json();
    if (!validId(body.rfqId)) return fail("Request not found", 404);

    const invite = await RFQVendor.findOne({ rfqId: body.rfqId, vendorId: session.vendorId });
    if (!invite) return fail("Not invited to this RFQ", 403);
    const rfq = (await RFQ.findById(body.rfqId).select("status").lean()) as { status?: string } | null;
    if (!rfq || ["closed", "cancelled", "awarded"].includes(rfq.status || "")) return fail("This request is closed", 409);
    const existing = await Quotation.findOne({ rfqId: body.rfqId, vendorId: session.vendorId, status: { $nin: ["draft", "withdrawn", "expired"] } }).select("_id");
    if (existing) return fail("You already quoted this request", 409);

    const lines = (Array.isArray(body.lines) ? body.lines : []).slice(0, 200).map((l: Record<string, unknown>) => {
      const quantity = num(l.quantity);
      const unitPrice = num(l.unitPrice);
      return { name: String(l.name || "").slice(0, 200), quantity, unitPrice, total: Math.round(quantity * unitPrice * 100) / 100, notes: String(l.notes || "").slice(0, 500) };
    });
    if (!lines.length || lines.some((l: { unitPrice: number }) => l.unitPrice <= 0)) return fail("Add a unit price for every line", 400);
    const subtotal = lines.reduce((s: number, l: { total: number }) => s + l.total, 0);
    const vatIncluded = Boolean(body.vatIncluded);
    const shipping = num(body.shipping);
    const tax = vatIncluded ? 0 : Math.round((subtotal + shipping) * 0.15 * 100) / 100;

    const quotation = await Quotation.create({
      rfqId: body.rfqId,
      vendorId: session.vendorId,
      lines,
      currency: "SAR",
      subtotal,
      tax,
      shipping,
      total: Math.round((subtotal + tax + shipping) * 100) / 100,
      deliveryTime: String(body.deliveryTime || "").slice(0, 80),
      leadTime: String(body.leadTime || "").slice(0, 80),
      paymentTerms: String(body.paymentTerms || "").slice(0, 120),
      validity: body.validity ? new Date(body.validity) : undefined,
      warranty: String(body.warranty || "").slice(0, 200),
      notes: String(body.notes || "").slice(0, 2000),
      vatIncluded,
      status: "submitted",
      lifecycle: { quotedAt: new Date() },
    });

    invite.status = "quoted";
    await invite.save();
    return ok(quotation, "Quotation submitted", 201);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

/** Buyer decisions on a quote. Only the buyer who owns the request (or staff) can act. */
export async function PATCH(req: Request) {
  try {
    const session = await requireSession("quotations:view");
    await connectDB();
    const body = await req.json();
    if (!validId(body.id)) return fail("Not found", 404);
    const q = await Quotation.findById(body.id);
    if (!q) return fail("Not found", 404);
    const rfq = await RFQ.findById(q.rfqId);
    if (!rfq) return fail("Not found", 404);
    if (String(rfq.buyerId) !== session.id && !isStaff(session)) return fail("Not found", 404);

    const note = String(body.reason || body.message || "").trim().slice(0, 1000);
    const now = new Date();
    const status = q.status || "submitted";
    switch (body.action) {
      case "accept": {
        if (!OPEN.includes(status)) return fail("This quote can't be accepted now", 409);
        q.status = "accepted";
        q.set("lifecycle.acceptedAt", now);
        await Quotation.updateMany(
          { rfqId: q.rfqId, _id: { $ne: q._id }, status: { $in: OPEN } },
          { $set: { status: "rejected", buyerNote: "The buyer chose another supplier." } }
        );
        rfq.status = "awarded";
        await rfq.save();
        break;
      }
      case "reject":
        if (!OPEN.includes(status)) return fail("This quote can't be declined now", 409);
        q.status = "rejected";
        q.buyerNote = note;
        break;
      case "clarify":
        if (!OPEN.includes(status)) return fail("This quote is closed", 409);
        if (!note) return fail("Write your question", 400);
        q.status = "clarifying";
        q.buyerNote = note;
        q.set("lifecycle.clarifyingAt", now);
        break;
      case "shortlist":
        if (!OPEN.includes(status)) return fail("This quote is closed", 409);
        q.status = "shortlisted";
        q.set("lifecycle.shortlistedAt", now);
        break;
      case "confirm_deal":
        if (status !== "accepted") return fail("Accept the quote first", 409);
        q.status = "deal_confirmed";
        q.set("lifecycle.dealConfirmedAt", now);
        break;
      case "mark_reviewed":
        if (!["accepted", "deal_confirmed"].includes(status)) return fail("Accept the quote first", 409);
        q.status = "reviewed";
        q.set("lifecycle.reviewedAt", now);
        break;
      default:
        return fail("Unknown action", 400);
    }
    await q.save();
    const saved = (await Quotation.findById(q._id).populate("vendorId", PUBLIC_VENDOR).populate("rfqId", "title status deadline").lean()) as Record<string, unknown>;
    let contact: Record<string, string> | undefined;
    if (ACCEPTED.includes(String(q.status))) {
      const v = (await Vendor.findById(q.vendorId).select("phone email whatsapp tradeName legalName").lean()) as { phone?: string; email?: string; whatsapp?: string; tradeName?: string; legalName?: { en?: string } } | null;
      contact = { phone: v?.phone || "", email: v?.email || "", whatsapp: v?.whatsapp || "", company: v?.tradeName || v?.legalName?.en || "" };
    }
    return ok({ ...saved, contact });
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
