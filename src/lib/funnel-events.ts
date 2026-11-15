/**
 * Hukum Measurement — buyer & supplier funnel event names (canonical).
 * Use these everywhere instead of free-string literals for funnel steps.
 */

export const BUYER_FUNNEL = {
  landing_view: "landing_view",
  wa_conversation_start: "wa_conversation_start",
  search: "search",
  agent_need_captured: "agent_need_captured",
  add_to_compare: "add_to_compare",
  click_reveal_contact: "click_reveal_contact",
  signup_google: "signup_google",
  signup_microsoft: "signup_microsoft",
  signup_otp: "signup_otp",
  signup_email: "signup_email",
  contact_revealed: "contact_revealed",
  agent_outreach_sent: "agent_outreach_sent",
  quote_received: "quote_received",
  deal_confirmed: "deal_confirmed",
} as const;

export const SUPPLIER_FUNNEL = {
  vendor_landing_view: "vendor_landing_view",
  vendor_signup: "vendor_signup",
  vendor_verified: "vendor_verified",
  storefront_live: "storefront_live",
  lead_received: "lead_received",
  quote_sent: "quote_sent",
  subscription_activated: "subscription_activated",
} as const;

export const FUNNEL_EVENTS = { ...BUYER_FUNNEL, ...SUPPLIER_FUNNEL } as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[keyof typeof FUNNEL_EVENTS];

export const BUYER_FUNNEL_STEPS: Array<{ step: number; label: string; events: string[] }> = [
  { step: 1, label: "Visit or WhatsApp hello", events: ["landing_view", "wa_conversation_start"] },
  { step: 2, label: "Search or ask", events: ["search", "agent_need_captured"] },
  { step: 3, label: "Compare or reveal click", events: ["add_to_compare", "click_reveal_contact"] },
  { step: 4, label: "Sign-up", events: ["signup_google", "signup_microsoft", "signup_otp", "signup_email"] },
  { step: 5, label: "Supplier contacted", events: ["contact_revealed", "agent_outreach_sent"] },
  { step: 6, label: "Quote received", events: ["quote_received"] },
  { step: 7, label: "Deal confirmed", events: ["deal_confirmed"] },
];

export const SUPPLIER_FUNNEL_STEPS: Array<{ step: number; label: string; events: string[] }> = [
  { step: 1, label: "Visit or field contact", events: ["vendor_landing_view"] },
  { step: 2, label: "Sign-up", events: ["vendor_signup"] },
  { step: 3, label: "Verified", events: ["vendor_verified"] },
  { step: 4, label: "Storefront live", events: ["storefront_live"] },
  { step: 5, label: "First lead", events: ["lead_received"] },
  { step: 6, label: "First quote sent", events: ["quote_sent"] },
  { step: 7, label: "Paying subscriber", events: ["subscription_activated"] },
];
