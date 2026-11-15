import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { Conversation, Message, Notification } from "@/modules/platform/platform.model";
import { RFQ, Quotation } from "@/modules/rfqs/rfq.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { findOrCreateBuyerSupplierThread, postMessage } from "@/modules/messaging/thread-service";

export async function GET(req: Request) {
  try {
    const session = await requireSession("messages:view");
    await connectDB();
    const sp = new URL(req.url).searchParams;
    if (sp.get("resource") === "notifications") {
      const items = await Notification.find({ userId: session.id }).sort({ createdAt: -1 }).limit(50).lean();
      return ok(items);
    }
    const conversationId = sp.get("conversationId");
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId).lean();
      if (!conversation || !conversation.participants.map(String).includes(session.id)) {
        return fail("Forbidden", 403);
      }
      const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
      return ok({ conversation, messages });
    }
    const conversations = await Conversation.find({ participants: session.id }).sort({ updatedAt: -1 }).lean();
    return ok(conversations);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession("messages:create");
    await connectDB();
    const body = await req.json();

    if (body.action === "start") {
      // Threads are tied to a real quote or supplier, and their parties come from the data, never the client.
      const valid = (v: unknown): v is string => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);
      let buyerUserId = "";
      let sellerUserId = "";
      let vendorId = "";
      let rfqId: string | undefined;
      const quotationId = valid(body.quotationId) ? body.quotationId : undefined;
      if (quotationId) {
        const q = (await Quotation.findById(quotationId).select("vendorId rfqId").lean()) as { vendorId?: unknown; rfqId?: unknown } | null;
        const rfq = q ? ((await RFQ.findById(q.rfqId).select("buyerId").lean()) as { buyerId?: unknown } | null) : null;
        if (!q || !rfq) return fail("Not found", 404);
        vendorId = String(q.vendorId);
        rfqId = String(q.rfqId);
        if (String(rfq.buyerId) === session.id) buyerUserId = session.id;
        else if (session.vendorId === vendorId) { sellerUserId = session.id; buyerUserId = String(rfq.buyerId); }
        else return fail("Not found", 404);
      } else if (valid(body.vendorId)) {
        vendorId = body.vendorId;
        buyerUserId = session.id;
      } else {
        return fail("Pick a quote or supplier to message", 400);
      }
      if (!sellerUserId) {
        const v = (await Vendor.findById(vendorId).select("ownerUserId").lean()) as { ownerUserId?: unknown } | null;
        if (!v?.ownerUserId) return fail("This supplier can't receive messages yet", 409);
        sellerUserId = String(v.ownerUserId);
      }
      if (buyerUserId === sellerUserId) return fail("You can't message yourself", 400);
      const conversation = await findOrCreateBuyerSupplierThread({
        buyerUserId, sellerUserId, vendorId, rfqId, quotationId, subject: String(body.subject || "").slice(0, 140) || undefined,
      });
      return ok(conversation, "Conversation started", 201);
    }

    if (body.action === "send") {
      const text = String(body.body || "").trim();
      if (!text) return fail("Write a message", 400);
      const message = await postMessage({ conversationId: String(body.conversationId || ""), senderId: session.id, body: text, enforceContactGate: true });
      return ok(message, "Sent", 201);
    }

    return fail("Unknown action", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
