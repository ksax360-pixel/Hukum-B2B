// src/lib/vendor-requests.ts
// The supplier's side of requests: every request Hukum matched them to, with where it stands for them
// (new, opened, quoted, won, declined, closed). Stage is derived from the invite, their quote and the request.

import { RFQ, RFQVendor, Quotation } from "@/modules/rfqs/rfq.model";

export type SupplierStage = "new" | "opened" | "quoted" | "question" | "won" | "lost" | "closed";

export type SupplierRequestRow = {
  id: string;
  title: string;
  items: Array<{ name: string; quantity?: number; unit?: string }>;
  city?: string;
  neededBy?: string;
  deadline?: string;
  receivedAt: string;
  stage: SupplierStage;
  quoteTotal?: number;
  quoteId?: string;
};

type RfqDoc = {
  _id: unknown;
  title?: { en?: string; ar?: string };
  items?: Array<{ name?: { en?: string; ar?: string }; quantity?: number; unit?: string }>;
  deliveryLocation?: { city?: string };
  deliveryDate?: Date;
  deadline?: Date;
  status?: string;
};

export function supplierStage(inviteStatus: string, rfqStatus: string, quoteStatus?: string): SupplierStage {
  if (quoteStatus && ["accepted", "deal_confirmed", "reviewed"].includes(quoteStatus)) return "won";
  if (quoteStatus === "rejected") return "lost";
  if (quoteStatus === "clarifying") return "question";
  if (quoteStatus && !["draft", "withdrawn", "expired"].includes(quoteStatus)) return "quoted";
  if (rfqStatus === "cancelled" || rfqStatus === "closed" || rfqStatus === "awarded") return "closed";
  if (inviteStatus === "declined") return "closed";
  return inviteStatus === "viewed" ? "opened" : "new";
}

export async function loadSupplierRequests(vendorId: string, locale: string, limit = 40): Promise<SupplierRequestRow[]> {
  const isAr = locale === "ar";
  const invites = (await RFQVendor.find({ vendorId }).sort({ createdAt: -1 }).limit(limit).lean()) as Array<{
    rfqId: unknown;
    status?: string;
    createdAt?: Date;
  }>;
  const ids = invites.map((i) => i.rfqId);
  const [rfqs, quotes] = await Promise.all([
    RFQ.find({ _id: { $in: ids } }).select("title items deliveryLocation deliveryDate deadline status").lean() as Promise<RfqDoc[]>,
    Quotation.find({ vendorId, rfqId: { $in: ids } }).sort({ createdAt: -1 }).select("rfqId status total").lean() as Promise<
      Array<{ _id: unknown; rfqId: unknown; status?: string; total?: number }>
    >,
  ]);
  const rfqById = new Map(rfqs.map((r) => [String(r._id), r]));
  const quoteByRfq = new Map<string, { _id: unknown; status?: string; total?: number }>();
  for (const q of quotes) if (!quoteByRfq.has(String(q.rfqId))) quoteByRfq.set(String(q.rfqId), q);

  return invites
    .map((inv): SupplierRequestRow | null => {
      const r = rfqById.get(String(inv.rfqId));
      if (!r) return null;
      const q = quoteByRfq.get(String(r._id));
      const items = (r.items || []).map((it) => ({
        name: (isAr ? it.name?.ar || it.name?.en : it.name?.en || it.name?.ar) || "",
        quantity: it.quantity,
        unit: it.unit,
      }));
      return {
        id: String(r._id),
        title: items[0]?.name || (isAr ? r.title?.ar || r.title?.en : r.title?.en) || "",
        items,
        city: r.deliveryLocation?.city,
        neededBy: r.deliveryDate ? new Date(r.deliveryDate).toISOString() : undefined,
        deadline: r.deadline ? new Date(r.deadline).toISOString() : undefined,
        receivedAt: new Date(inv.createdAt || Date.now()).toISOString(),
        stage: supplierStage(inv.status || "invited", r.status || "open", q?.status),
        quoteTotal: q?.total,
        quoteId: q ? String(q._id) : undefined,
      };
    })
    .filter((x): x is SupplierRequestRow => Boolean(x));
}
