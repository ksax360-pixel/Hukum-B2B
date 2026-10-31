/**
 * Hukum notification matrix — triggers, copy, channels.
 */

export type NotifyChannel = "in_app" | "email" | "whatsapp" | "sms";

export type MatrixTrigger =
  | "buyer_signup_welcome"
  | "otp"
  | "supplier_contacted"
  | "new_lead"
  | "rfq_sent"
  | "quote_received"
  | "quote_expiring"
  | "lead_unanswered_4h"
  | "lead_unanswered_24h"
  | "lead_unanswered_48h"
  | "verification_decision"
  | "invoice_renewal"
  | "monthly_supplier_report"
  | "monthly_buyer_savings";

export type MatrixRow = {
  trigger: MatrixTrigger;
  channels: NotifyChannel[];
  title: { en: string; ar: string };
  bodyTemplate: { en: string; ar: string };
};

export const NOTIFICATION_MATRIX: MatrixRow[] = [
  {
    trigger: "buyer_signup_welcome",
    channels: ["email", "whatsapp", "in_app"],
    title: { en: "Welcome to Hukum", ar: "مرحباً بك في حكم" },
    bodyTemplate: {
      en: "Welcome{{name}}. Hukum’s agent finds suppliers, compares quotes, and keeps Saudi quiet hours. Start with a search or RFQ.",
      ar: "مرحباً{{name}}. وكيل حكم يجد الموردين ويقارن العروض ويحترم أوقات الهدوء. ابدأ ببحث أو طلب سعر.",
    },
  },
  {
    trigger: "otp",
    channels: ["sms"],
    title: { en: "One-time code", ar: "رمز لمرة واحدة" },
    bodyTemplate: {
      en: "Your Hukum code is {{code}}. Valid for a few minutes.",
      ar: "رمز حكم هو {{code}}. صالح لدقائق.",
    },
  },
  {
    trigger: "supplier_contacted",
    channels: ["in_app", "whatsapp", "email"],
    title: { en: "Supplier contacted", ar: "تم التواصل مع المورد" },
    bodyTemplate: {
      en: "You contacted {{vendor}}. Confirmation sent. The supplier received a new lead.",
      ar: "تواصلت مع {{vendor}}. تم التأكيد. استلم المورد عميلاً محتملاً جديداً.",
    },
  },
  {
    trigger: "new_lead",
    channels: ["in_app", "whatsapp", "email"],
    title: { en: "New lead", ar: "عميل محتمل جديد" },
    bodyTemplate: {
      en: "New RFQ / interest lead: “{{title}}”. Open your inbox to respond within 4 hours.",
      ar: "عميل محتمل جديد: «{{title}}». افتح صندوقك ورد خلال 4 ساعات.",
    },
  },
  {
    trigger: "rfq_sent",
    channels: ["in_app", "whatsapp", "email"],
    title: { en: "RFQ sent", ar: "أُرسل طلب السعر" },
    bodyTemplate: {
      en: "RFQ “{{title}}” sent to matched suppliers. You’ll get quotes in your inbox.",
      ar: "أُرسل طلب السعر «{{title}}» للموردين المطابقين. ستصلك العروض في صندوقك.",
    },
  },
  {
    trigger: "quote_received",
    channels: ["in_app", "whatsapp"],
    title: { en: "Quote received", ar: "وصل عرض سعر" },
    bodyTemplate: {
      en: "{{vendor}} quoted on “{{title}}” ({{currency}} {{total}}). Compare: {{link}}",
      ar: "قدّم {{vendor}} عرضاً على «{{title}}» ({{currency}} {{total}}). قارن: {{link}}",
    },
  },
  {
    trigger: "quote_expiring",
    channels: ["in_app", "whatsapp"],
    title: { en: "Quote expiring soon", ar: "صلاحية العرض تنتهي" },
    bodyTemplate: {
      en: "A quote on “{{title}}” expires within ~{{hours}}h. Review before it lapses.",
      ar: "عرض على «{{title}}» ينتهي خلال ~{{hours}} ساعة. راجعه قبل انتهاء الصلاحية.",
    },
  },
  {
    trigger: "lead_unanswered_4h",
    channels: ["whatsapp", "in_app"],
    title: { en: "Lead waiting (4h)", ar: "عميل ينتظر (4 ساعات)" },
    bodyTemplate: {
      en: "RFQ “{{title}}” invite still unopened after 4 hours. Open and respond.",
      ar: "دعوة طلب السعر «{{title}}» لم تُفتح منذ 4 ساعات. افتحها ورد.",
    },
  },
  {
    trigger: "lead_unanswered_24h",
    channels: ["whatsapp", "in_app"],
    title: { en: "Lead waiting (24h)", ar: "عميل ينتظر (24 ساعة)" },
    bodyTemplate: {
      en: "Still no view on “{{title}}” after 24h. Buyers move on — reply today.",
      ar: "ما زالت «{{title}}» بلا فتح بعد 24 ساعة. المشترون ينتقلون — رد اليوم.",
    },
  },
  {
    trigger: "lead_unanswered_48h",
    channels: ["whatsapp", "in_app"],
    title: { en: "Lead rerouted (48h)", ar: "إعادة توجيه (48 ساعة)" },
    bodyTemplate: {
      en: "Invite “{{title}}” escalated after 48h no response. Priority may shift to another supplier.",
      ar: "أُعيد توجيه دعوة «{{title}}» بعد 48 ساعة بلا رد. قد تنتقل الأولوية لمورد آخر.",
    },
  },
  {
    trigger: "verification_decision",
    channels: ["email", "in_app"],
    title: { en: "Verification update", ar: "تحديث التحقق" },
    bodyTemplate: {
      en: "Your supplier verification is {{decision}}. {{detail}}",
      ar: "حالة تحقق المورد: {{decision}}. {{detail}}",
    },
  },
  {
    trigger: "invoice_renewal",
    channels: ["email"],
    title: { en: "Invoice / renewal", ar: "فاتورة / تجديد" },
    bodyTemplate: {
      en: "ZATCA invoice {{invoiceId}} — {{amount}} {{currency}}. Renewal reminder: {{detail}}",
      ar: "فاتورة الزكاة {{invoiceId}} — {{amount}} {{currency}}. تذكير التجديد: {{detail}}",
    },
  },
  {
    trigger: "monthly_supplier_report",
    channels: ["email", "in_app"],
    title: { en: "Monthly performance report", ar: "تقرير الأداء الشهري" },
    bodyTemplate: {
      en: "Your Hukum month: {{quotes}} quotes, {{wins}} wins, SAR {{pipeline}} pipeline. Open the dashboard for detail.",
      ar: "شهرك على حكم: {{quotes}} عروض، {{wins}} فوز، خط أنابيب {{pipeline}} ر.س. افتح اللوحة للتفاصيل.",
    },
  },
  {
    trigger: "monthly_buyer_savings",
    channels: ["email", "in_app"],
    title: { en: "Monthly savings summary", ar: "ملخص التوفير الشهري" },
    bodyTemplate: {
      en: "This month you compared {{quotes}} quotes. Estimated savings vs highest: SAR {{savings}}.",
      ar: "هذا الشهر قارنت {{quotes}} عرضاً. التوفير التقديري مقابل الأعلى: {{savings}} ر.س.",
    },
  },
];

export function fillTemplate(tpl: string, vars: Record<string, string | number | undefined>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = vars[key];
    return v == null || v === "" ? "" : String(v);
  });
}

export function getMatrixRow(trigger: MatrixTrigger): MatrixRow {
  const row = NOTIFICATION_MATRIX.find((r) => r.trigger === trigger);
  if (!row) throw new Error(`Unknown matrix trigger: ${trigger}`);
  return row;
}
