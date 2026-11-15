// src/lib/buyer-requests.ts
// One row per request for the buyer home: where it stands, how many suppliers it reached,
// how many quotes came back and the best total so far. Stage is derived, never stored.

import { RFQ, RFQVendor, Quotation } from "@/modules/rfqs/rfq.model";

export type RequestStage = "finding" | "waiting" | "compare" | "chosen" | "closed";

export type BuyerRequestRow = {
  id: string;
  title: string;
  items: Array<{ name: string; quantity?: number; unit?: string }>;
  city?: string;
  neededBy?: string;
  createdAt: string;
  reached: number;
  quotes: number;
  newQuotes: number;
  bestTotal?: number;
  currency: string;
  stage: RequestStage;
};

const LIVE_QUOTE = ["submitted", "clarifying", "revised", "shortlisted", "accepted", "deal_confirmed", "reviewed"];
const NEW_QUOTE = ["submitted", "revised"];

export function stageOf(status: string, reached: number, quotes: number, chosen: boolean): RequestStage {
  if (status === "cancelled" || status === "closed") return "closed";
  if (chosen || status === "awarded") return "chosen";
  if (quotes > 0) return "compare";
  if (reached > 0) return "waiting";
  return "finding";
}

type RfqDoc = {
  _id: unknown;
  title?: { en?: string; ar?: string };
  items?: Array<{ name?: { en?: string; ar?: string }; quantity?: number; unit?: string }>;
  deliveryLocation?: { city?: string };
  deliveryDate?: Date;
  status?: string;
  currency?: string;
  createdAt?: Date;
};

export async function loadBuyerRequests(buyerId: string, locale: string, limit = 30): Promise<BuyerRequestRow[]> {
  const isAr = locale === "ar";
  const rfqs = (await RFQ.find({ buyerId }).sort({ createdAt: -1 }).limit(limit).lean()) as RfqDoc[];
  const ids = rfqs.map((r) => r._id);
  const [reachAgg, quoteAgg] = await Promise.all([
    RFQVendor.aggregate([{ $match: { rfqId: { $in: ids } } }, { $group: { _id: "$rfqId", n: { $sum: 1 } } }]),
    Quotation.aggregate([
      { $match: { rfqId: { $in: ids }, status: { $in: LIVE_QUOTE } } },
      {
        $group: {
          _id: "$rfqId",
          n: { $sum: 1 },
          fresh: { $sum: { $cond: [{ $in: ["$status", NEW_QUOTE] }, 1, 0] } },
          best: { $min: "$total" },
          chosen: { $max: { $cond: [{ $in: ["$status", ["accepted", "deal_confirmed", "reviewed"]] }, 1, 0] } },
        },
      },
    ]),
  ]);
  const reach = new Map(reachAgg.map((x: { _id: unknown; n: number }) => [String(x._id), x.n]));
  const quotes = new Map(
    quoteAgg.map((x: { _id: unknown; n: number; fresh: number; best?: number; chosen: number }) => [String(x._id), x])
  );

  return rfqs.map((r) => {
    const id = String(r._id);
    const q = quotes.get(id);
    const reached = reach.get(id) || 0;
    const items = (r.items || []).map((it) => ({
      name: (isAr ? it.name?.ar || it.name?.en : it.name?.en || it.name?.ar) || "",
      quantity: it.quantity,
      unit: it.unit,
    }));
    return {
      id,
      title: items[0]?.name || (isAr ? r.title?.ar || r.title?.en : r.title?.en) || "",
      items,
      city: r.deliveryLocation?.city,
      neededBy: r.deliveryDate ? new Date(r.deliveryDate).toISOString() : undefined,
      createdAt: new Date(r.createdAt || Date.now()).toISOString(),
      reached,
      quotes: q?.n || 0,
      newQuotes: q?.fresh || 0,
      bestTotal: q?.best ?? undefined,
      currency: r.currency || "SAR",
      stage: stageOf(r.status || "open", reached, q?.n || 0, Boolean(q?.chosen)),
    };
  });
}
