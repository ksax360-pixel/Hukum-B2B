/** Normalize quotation totals for side-by-side buyer compare (unit, VAT, delivery). */

export type RawQuote = {
  _id: string;
  total?: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  leadTime?: string;
  deliveryTime?: string;
  paymentTerms?: string;
  validity?: string;
  status?: string;
  lines?: Array<{ quantity?: number; unitPrice?: number; total?: number; name?: string }>;
  vendorId?: { legalName?: { en?: string; ar?: string }; tradeName?: string; verificationStatus?: string };
};

export type NormalizedQuote = {
  id: string;
  vendorLabel: string;
  verified: boolean;
  currency: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  landedPerUnit: number;
  taxIncludedHint: boolean;
  leadTime: string;
  paymentTerms: string;
  validity: string;
  status: string;
};

function sumQty(lines?: RawQuote["lines"]) {
  if (!lines?.length) return 1;
  return Math.max(
    1,
    lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0)
  );
}

export function normalizeQuote(q: RawQuote, locale = "en"): NormalizedQuote {
  const qty = sumQty(q.lines);
  const subtotal =
    Number(q.subtotal) ||
    (q.lines?.length
      ? q.lines.reduce((s, l) => s + (Number(l.total) || Number(l.unitPrice || 0) * Number(l.quantity || 0)), 0)
      : Number(q.total) || 0);
  const tax = Number(q.tax) || 0;
  const shipping = Number(q.shipping) || 0;
  const vatIncluded = Boolean((q as { vatIncluded?: boolean }).vatIncluded);
  // When VAT is included in prices, do not add tax on top of subtotal.
  const total =
    Number(q.total) ||
    (vatIncluded ? subtotal + shipping : subtotal + tax + shipping);
  const unitPrice =
    q.lines?.[0]?.unitPrice != null
      ? Number(q.lines[0].unitPrice)
      : qty > 0
        ? subtotal / qty
        : total;
  const taxIncludedHint = tax === 0 && total > 0 && subtotal > 0 && Math.abs(total - subtotal - shipping) < 0.01;
  const vendor = q.vendorId;
  const vendorLabel =
    (locale === "ar" ? vendor?.legalName?.ar : vendor?.legalName?.en) ||
    vendor?.legalName?.en ||
    vendor?.tradeName ||
    "Supplier";

  return {
    id: String(q._id),
    vendorLabel,
    verified: vendor?.verificationStatus === "verified",
    currency: q.currency || "SAR",
    qty,
    unitPrice: Math.round(unitPrice * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
    landedPerUnit: Math.round((total / qty) * 100) / 100,
    taxIncludedHint,
    leadTime: q.leadTime || q.deliveryTime || "—",
    paymentTerms: q.paymentTerms || "—",
    validity: q.validity || "—",
    status: q.status || "sent",
  };
}

export function recommendQuote(quotes: NormalizedQuote[]): string | null {
  if (!quotes.length) return null;
  const open = quotes.filter((q) => !["rejected", "withdrawn", "expired"].includes(q.status));
  const pool = open.length ? open : quotes;
  const best = [...pool].sort((a, b) => a.landedPerUnit - b.landedPerUnit)[0];
  return best?.id || null;
}

/**
 * Freeform quote text / email / OCR stub → structured fields for like-for-like compare.
 * Does not invent missing line items — only extracts what is present.
 */
export function ingestFreeformQuote(
  text: string,
  opts?: { id?: string; locale?: string }
): NormalizedQuote {
  const raw = String(text || "");
  const currency = /SAR|ر\.?\s*س|ريال/i.test(raw) ? "SAR" : /USD|\$/i.test(raw) ? "USD" : "SAR";
  const unitMatch = raw.match(/(?:unit(?:\s*price)?|سعر\s*الوحدة)[:\s]*([\d,.]+)/i);
  const qtyMatch = raw.match(/(?:qty|quantity|كمية)[:\s]*([\d,.]+)/i);
  const totalMatch = raw.match(/(?:total|الإجمالي|المجموع)[:\s]*([\d,.]+)/i);
  const taxMatch = raw.match(/(?:vat|tax|ضريبة)[:\s]*([\d,.]+)/i);
  const shipMatch = raw.match(/(?:shipping|delivery|شحن|توصيل)[:\s]*([\d,.]+)/i);
  const leadMatch = raw.match(/(?:lead\s*time|delivery\s*time|مهلة|توريد)[:\s]*([^\n.]+)/i);
  const payMatch = raw.match(/(?:payment|دفع)[:\s]*([^\n.]+)/i);

  const num = (s?: string | null) => (s ? Number(String(s).replace(/,/g, "")) : 0);
  const qty = Math.max(1, num(qtyMatch?.[1]) || 1);
  const unitPrice = num(unitMatch?.[1]);
  const tax = num(taxMatch?.[1]);
  const shipping = num(shipMatch?.[1]);
  let total = num(totalMatch?.[1]);
  const subtotal = unitPrice ? unitPrice * qty : total - tax - shipping;
  if (!total) total = subtotal + tax + shipping;

  return normalizeQuote(
    {
      _id: opts?.id || `freeform_${Date.now()}`,
      currency,
      lines: unitPrice ? [{ quantity: qty, unitPrice, total: unitPrice * qty, name: "Extracted line" }] : [],
      subtotal: subtotal || undefined,
      tax,
      shipping,
      total: total || undefined,
      leadTime: leadMatch?.[1]?.trim(),
      paymentTerms: payMatch?.[1]?.trim(),
      status: "submitted",
    },
    opts?.locale || "en"
  );
}
