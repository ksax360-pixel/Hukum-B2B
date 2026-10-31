/** Hukum AI agent — WhatsApp & web journey types (10 steps + guardrails). */

export type HukumChannel = "web" | "whatsapp" | "qr";

export type HukumStep =
  | "start"
  | "identify"
  | "understand"
  | "clarify"
  | "shortlist"
  | "compare"
  | "contact"
  | "collect_quotes"
  | "recommend"
  | "decide"
  | "escalated";

export type NeedSlots = {
  category?: string;
  specs?: string;
  quantity?: number;
  unit?: string;
  city?: string;
  deadline?: string;
  rawText?: string;
  confidence?: number;
};

export type ShortlistItem = {
  productId: string;
  vendorId?: string;
  name: string;
  slug: string;
  href: string;
  priceLabel: string;
  vendorName?: string;
  city?: string;
  verified?: boolean;
  score: number;
  paidPriority?: boolean;
};

export type PendingOutbound = {
  id: string;
  vendorIds: string[];
  productIds: string[];
  draftMessage: string;
  status: "awaiting_buyer_approval" | "approved" | "sent" | "cancelled";
  createdAt: string;
};

export type HukumTurnResult = {
  sessionId: string;
  step: HukumStep;
  reply: string;
  need?: NeedSlots;
  products?: ShortlistItem[];
  compareHref?: string;
  quoteCards?: Array<{
    id: string;
    vendorLabel: string;
    unitPrice: number;
    landedPerUnit: number;
    currency: string;
    leadTime: string;
    total: number;
    recommended?: boolean;
  }>;
  pendingOutbound?: PendingOutbound | null;
  followUps?: string[];
  suggestedLinks?: { label: string; href: string }[];
  actions?: Array<{ id: string; label: string }>;
  escalated?: boolean;
  guardrailNotes?: string[];
  source: "hukum";
};
