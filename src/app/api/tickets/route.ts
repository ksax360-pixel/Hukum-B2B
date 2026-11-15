import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

const CATEGORIES = ["General", "Verification", "Catalog", "RFQ", "Billing", "Account", "Report"];
import { SupportTicket } from "@/modules/platform/platform.model";
import { AuditLog } from "@/modules/documents/document.model";

function toClient(doc: {
  _id: unknown;
  ticketKey?: string;
  topic?: string;
  status?: string;
  urgency?: string;
  createdAt?: Date;
  requester?: string;
  category?: string;
  body?: string;
}) {
  return {
    id: doc.ticketKey || String(doc._id),
    _id: String(doc._id),
    topic: doc.topic || "",
    status: (doc.status || "Open") as "Open" | "In Progress" | "Resolved" | "Closed",
    urgency: (doc.urgency || "Medium") as "High" | "Medium" | "Low",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    requester: doc.requester || "",
    category: doc.category || "General",
    body: doc.body || "",
  };
}

export async function GET() {
  try {
    const session = await requireSession("messages:view");
    await connectDB();
    // Support staff see the queue; everyone else sees only the tickets they raised.
    const staff = hasPermission(session.roles, "messages:manage");
    const items = await SupportTicket.find(staff ? {} : { createdBy: session.id }).sort({ createdAt: -1 }).limit(200).lean();
    return ok(items.map(toClient));
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
    const topic = String(body.topic || "").trim();
    const text = String(body.body || "").trim();
    if (!topic || !text) return fail("Topic and body are required", 400);
    if (topic.length > 140 || text.length > 4000) return fail("Keep the subject under 140 and the message under 4000 characters", 400);

    const count = await SupportTicket.countDocuments();
    const ticketKey = `KT-${1000 + count + 1}`;
    const doc = await SupportTicket.create({
      ticketKey,
      topic,
      category: CATEGORIES.includes(body.category) ? body.category : "General",
      urgency: ["High", "Medium", "Low"].includes(body.urgency) ? body.urgency : "Medium",
      requester: session.email || "User",
      body: text,
      createdBy: session.id,
      roleScope: ["buyer", "vendor", "admin"].includes(body.roleScope) ? body.roleScope : "buyer",
      status: "Open",
    });

    await AuditLog.create({
      userId: session.id,
      action: "created",
      entity: "SupportTicket",
      entityId: String(doc._id),
      newValue: { ticketKey, topic },
    });

    return ok(toClient(doc.toObject()), "Ticket created", 201);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession("messages:manage");
    await connectDB();
    const body = await req.json();
    const id = body.id || body.ticketKey;
    if (!id) return fail("Ticket id required", 400);

    const doc = await SupportTicket.findOne(
      typeof id === "string" && id.startsWith("KT-") ? { ticketKey: id } : { _id: id }
    );
    if (!doc) return fail("Ticket not found", 404);

    const prev = doc.status;
    if (body.status) doc.status = body.status;
    if (body.urgency) doc.urgency = body.urgency;
    await doc.save();

    await AuditLog.create({
      userId: session.id,
      action: "updated",
      entity: "SupportTicket",
      entityId: String(doc._id),
      previousValue: { status: prev },
      newValue: { status: doc.status },
    });

    return ok(toClient(doc.toObject()));
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
