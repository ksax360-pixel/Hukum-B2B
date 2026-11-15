import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { Enquiry } from "@/modules/enquiries/enquiry.model";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { requireSession } from "@/lib/auth";
import { AuditLog } from "@/modules/documents/document.model";

const ALLOWED_TYPES = new Set([
  "general",
  "buyer",
  "supplier",
  "partnership",
  "support",
  "media",
  "other",
]);

function makeReference() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `KT-${n}`;
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function GET(req: Request) {
  try {
    await requireSession("admin:view");
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const id = sp.get("id");
    if (id) {
      const row = await Enquiry.findById(id).lean();
      if (!row) return fail("Not found", 404);
      return ok(row);
    }
    const q: Record<string, unknown> = {};
    if (sp.get("status")) q.status = sp.get("status");
    if (sp.get("type")) q.enquiryType = sp.get("type");
    const limit = Math.min(100, Number(sp.get("limit") || 50));
    const items = await Enquiry.find(q).sort({ createdAt: -1 }).limit(limit).lean();
    return ok(items);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession("admin:view");
    await connectDB();
    const body = await req.json();
    const row = await Enquiry.findById(body.id);
    if (!row) return fail("Not found", 404);
    const allowed = ["new", "reviewing", "replied", "closed", "spam"];
    if (body.status && !allowed.includes(body.status)) return fail("Invalid status", 400);
    const prev = row.status;
    if (body.status) row.status = body.status;
    await row.save();
    await AuditLog.create({
      userId: session.id,
      action: "updated",
      entity: "Enquiry",
      entityId: String(row._id),
      previousValue: { status: prev },
      newValue: { status: row.status },
    });
    return ok(row);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = (await req.json()) as Record<string, unknown>;

    const fullName = String(body.fullName || "").trim();
    const companyName = String(body.companyName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const country = String(body.country || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    const enquiryType = String(body.enquiryType || "general").trim();
    const locale = String(body.locale || "en").trim();
    const extras = (body.extras && typeof body.extras === "object" ? body.extras : {}) as Record<
      string,
      unknown
    >;
    const attachmentMeta =
      body.attachmentMeta && typeof body.attachmentMeta === "object"
        ? (body.attachmentMeta as { name?: string; size?: number; type?: string })
        : undefined;

    if (!fullName || !companyName || !email || !subject || !message) {
      return fail("Missing required fields", 400);
    }
    if (!isEmail(email)) return fail("Invalid email", 400);
    if (!ALLOWED_TYPES.has(enquiryType)) return fail("Invalid enquiry type", 400);
    if (message.length > 8000) return fail("Message too long", 400);

    if (attachmentMeta?.size && attachmentMeta.size > 8 * 1024 * 1024) {
      return fail("Attachment too large (max 8MB)", 400);
    }

    let reference = makeReference();
    for (let i = 0; i < 5; i += 1) {
      const exists = await Enquiry.exists({ reference });
      if (!exists) break;
      reference = makeReference();
    }

    const ua = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";

    const enquiry = await Enquiry.create({
      reference,
      enquiryType,
      fullName,
      companyName,
      email,
      phone,
      country,
      subject,
      message,
      extras,
      attachmentMeta: attachmentMeta?.name
        ? {
            name: attachmentMeta.name,
            size: attachmentMeta.size,
            type: attachmentMeta.type,
          }
        : undefined,
      locale,
      status: "new",
      source: "contact_page",
      meta: {
        userAgent: ua,
        referer,
        device: /Mobile|Android|iPhone/i.test(ua) ? "mobile" : "desktop",
      },
    });

    await recordAnalyticsEvent({
      type: "contact_form_submitted",
      meta: {
        enquiryType,
        reference,
        country,
        locale,
        hasAttachment: Boolean(attachmentMeta?.name),
      },
    }).catch(() => undefined);

    return ok(
      {
        id: String(enquiry._id),
        reference: enquiry.reference,
      },
      "Enquiry received",
      201
    );
  } catch (e) {
    const err = e as Error;
    return fail(err.message || "Failed to submit enquiry", 500);
  }
}
