import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { RFQ, RFQVendor, Quotation } from "@/modules/rfqs/rfq.model";
import { requireSession } from "@/lib/auth";
import { matchVendorsForRfq } from "@/modules/rfqs/matching.service";
import { understandRfq } from "@/modules/ai/ai.service";
import { aiProvider } from "@/modules/ai/provider";

export async function GET(req: Request) {
  try {
    const session = await requireSession("rfqs:view");
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const id = sp.get("id");

    if (id) {
      const rfq = await RFQ.findById(id).lean();
      if (!rfq) return fail("Not found", 404);
      const isAdmin = session.roles.some((r) => ["admin", "super_admin"].includes(r));
      const isOwner = String(rfq.buyerId) === session.id;
      const invited = session.vendorId
        ? await RFQVendor.findOne({ rfqId: id, vendorId: session.vendorId })
        : null;
      if (!isAdmin && !isOwner && !invited) return fail("Forbidden", 403);
      if (!isAdmin && !isOwner) {
        // An invited supplier sees the request without the buyer's contact details, and only their own
        // invite and quote: never competitors' prices or who else was invited (contact goes through the relay).
        const safeRfq = {
          ...rfq,
          buyerId: undefined,
          organizationId: undefined,
          aiUnderstanding: undefined,
          additionalRequirements: String(rfq.additionalRequirements || "")
            .split("\n")
            .filter((l: string) => !/^(contact person|contact email|contact phone|buyer company|preferred vendor id|related product id)\s*:/i.test(l.trim()))
            .join("\n"),
        };
        const ownQuotes = await Quotation.find({ rfqId: id, vendorId: session.vendorId }).lean();
        // Accepting a quote shares contacts both ways: the winning supplier now gets the buyer's details.
        const won = (ownQuotes as Array<{ status?: string }>).some((q) => ["accepted", "deal_confirmed", "reviewed"].includes(q.status || ""));
        let buyerContact: Record<string, string> | undefined;
        if (won) {
          const field = (label: string): string =>
            String(rfq.additionalRequirements || "").split("\n").map((l: string) => l.trim()).find((l: string) => l.toLowerCase().startsWith(`${label}:`))?.slice(label.length + 1).trim() || "";
          buyerContact = { name: field("contact person"), company: field("buyer company"), phone: field("contact phone"), email: field("contact email") };
        }
        return ok({ rfq: safeRfq, invitations: invited ? [invited] : [], quotations: ownQuotes, buyerContact });
      }
      const invitations = await RFQVendor.find({ rfqId: id }).populate("vendorId", "legalName verificationStatus").lean();
      const quotations = await Quotation.find({ rfqId: id }).populate("vendorId", "legalName").lean();
      return ok({ rfq, invitations, quotations });
    }

    const query: Record<string, unknown> = {};
    if (sp.get("scope") === "vendor" && session.vendorId) {
      const invites = await RFQVendor.find({ vendorId: session.vendorId }).select("rfqId").lean();
      query._id = { $in: invites.map((i) => i.rfqId) };
    } else if (!session.roles.some((r) => ["admin", "super_admin"].includes(r))) {
      query.buyerId = session.id;
    }

    const supplierView = sp.get("scope") === "vendor" && session.vendorId && !session.roles.some((r) => ["admin", "super_admin"].includes(r));
    // Suppliers get the request itself, not the buyer's identity or contact lines.
    const items = await RFQ.find(query)
      .select(supplierView ? "title description items deliveryLocation deliveryDate deadline status currency createdAt" : "")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return ok(items);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (body.action === "set_status") {
      const session = await requireSession("rfqs:manage");
      const rfq = await RFQ.findById(body.rfqId || body.id);
      if (!rfq) return fail("Not found", 404);
      const staff = session.roles.some((r) => ["admin", "super_admin", "platform_admin"].includes(r));
      if (!staff && String(rfq.buyerId) !== session.id) return fail("Forbidden", 403);
      const allowed = staff ? ["draft", "open", "matching", "quoted", "negotiation", "awarded", "closed", "cancelled"] : ["closed", "cancelled", "open"];
      if (!allowed.includes(body.status)) return fail("Invalid status", 400);
      const prev = rfq.status;
      rfq.status = body.status;
      await rfq.save();
      const { AuditLog } = await import("@/modules/documents/document.model");
      await AuditLog.create({
        userId: session.id,
        action: "updated",
        entity: "RFQ",
        entityId: String(rfq._id),
        previousValue: { status: prev },
        newValue: { status: rfq.status },
      });
      return ok(rfq);
    }

    const session = await requireSession("rfqs:create");

    if (body.action === "create") {
      let aiUnderstanding = body.aiUnderstanding;
      if (body.useAI && body.descriptionText) {
        if (aiProvider.isConfigured()) {
          try {
            aiUnderstanding = await understandRfq(body.descriptionText);
          } catch {
            /* RFQ still saves without AI enrichment */
          }
        }
      }
      const rfq = await RFQ.create({
        buyerId: session.id,
        organizationId: session.organizationId,
        title: body.title || { en: body.titleEn || "RFQ", ar: body.titleAr || "" },
        description: body.description || { en: body.descriptionText || "", ar: "" },
        items: body.items || [],
        deliveryDate: body.deliveryDate || undefined,
        deliveryLocation: body.deliveryLocation,
        budget: body.budget != null && body.budget !== "" ? Number(body.budget) : undefined,
        currency: body.currency || "SAR",
        paymentTerms: body.paymentTerms,
        incoterms: body.incoterms,
        additionalRequirements: body.additionalRequirements,
        deadline: body.deadline || undefined,
        status: body.status || "open",
        aiUnderstanding,
      });
      return ok(rfq, "RFQ created", 201);
    }

    if (body.action === "match") {
      await requireSession("rfqs:edit");
      const rfq = await RFQ.findById(body.rfqId);
      if (!rfq) return fail("Not found", 404);
      if (String(rfq.buyerId) !== session.id && !session.roles.includes("admin")) return fail("Forbidden", 403);

      const matches = await matchVendorsForRfq({
        categoryId: body.categoryId || rfq.items?.[0]?.categoryId?.toString(),
        city: rfq.deliveryLocation?.city,
        quantity: rfq.items?.[0]?.quantity,
        // AI hints when available; otherwise the item names the buyer typed (AI off = no hints = 0 matches).
        textHints: [
          ...(rfq.aiUnderstanding?.productHints || []),
          ...(rfq.items || []).map((it: { name?: { en?: string; ar?: string } }) => it.name?.en || it.name?.ar || ""),
          rfq.title?.en || rfq.title?.ar || "",
        ].filter(Boolean),
      });

      for (const m of matches.slice(0, body.limit || 10)) {
        await RFQVendor.findOneAndUpdate(
          { rfqId: rfq._id, vendorId: m.vendorId },
          { status: "invited", matchReasons: m.reasons, matchScore: m.score },
          { upsert: true }
        );
      }
      rfq.status = "matching";
      await rfq.save();
      return ok({ matches }, "Vendors matched — buyer must confirm before treating as award");
    }

    if (body.action === "vendor_respond") {
      await requireSession("rfqs:view");
      if (!session.vendorId) return fail("Vendor required", 403);
      const invite = await RFQVendor.findOne({ rfqId: body.rfqId, vendorId: session.vendorId });
      if (!invite) return fail("Not invited", 403);
      invite.status = body.status;
      await invite.save();
      return ok(invite);
    }

    return fail("Unknown action", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
