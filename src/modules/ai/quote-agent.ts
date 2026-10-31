import { aiProvider, type ChatMessage } from "@/modules/ai/provider";
import { gatewayComplete } from "@/modules/ai/gateway";

export type QuoteAgentReply = {
  reply: string;
  draft?: Record<string, unknown>;
  followUps?: string[];
  source: "ai" | "heuristic";
};

function heuristicBuyer(message: string, locale: string): QuoteAgentReply {
  const isAr = locale === "ar";
  const q = message.toLowerCase();
  if (/qty|quantity|كمية|موعد|deadline|budget|ميزانية|cert|شهادة/.test(q)) {
    return {
      source: "heuristic",
      reply: isAr
        ? "لتقوية طلبك: حدّد الكمية، المدينة، الموعد النهائي، الميزانية التقريبية، والشهادات المطلوبة. ثم أرسل RFQ ليصل للموردين المناسبين."
        : "Strengthen your requirement: specify quantity, city, deadline, rough budget, and required certifications — then send an RFQ to matched sellers.",
      draft: {
        checklist: ["quantity", "delivery city", "deadline", "budget", "certifications"],
      },
      followUps: isAr
        ? ["ساعدني بصياغة وصف RFQ", "ما الذي يجب أن أطلبه من المورد؟"]
        : ["Help me draft RFQ description", "What should I ask the seller?"],
    };
  }
  return {
    source: "heuristic",
    reply: isAr
      ? "أنا وكيل المشتري لعروض الأسعار. صف احتياجك وسأقترح صياغة أوضح، أسئلة توضيحية، وخطوات قبول/رفض العروض."
      : "I’m the buyer quotation agent. Describe your need and I’ll suggest a clearer RFQ, clarifying questions, and accept/reject next steps.",
    followUps: isAr
      ? ["صغ لي متطلبات السلامة", "كيف أقارن عروض الأسعار؟"]
      : ["Draft safety PPE requirements", "How do I compare quotations?"],
  };
}

function heuristicSeller(message: string, locale: string, context?: Record<string, unknown>): QuoteAgentReply {
  const isAr = locale === "ar";
  const qty = Number(context?.quantity) || 1;
  const target = Number(context?.targetPrice) || 0;
  const catalog = Array.isArray(context?.catalogue)
    ? (context!.catalogue as Array<{ name?: string; price?: number; sku?: string; leadTime?: string }>)
    : [];
  const msg = message.toLowerCase();
  const grounded = catalog.find((c) => {
    const n = String(c.name || "").toLowerCase();
    return n && (msg.includes(n.slice(0, 6)) || n.split(" ").some((w) => w.length > 3 && msg.includes(w)));
  });
  const unitHint =
    grounded?.price != null
      ? Number(grounded.price)
      : target > 0
        ? Math.round(target * 0.95)
        : 100;
  const lead = grounded?.leadTime || "14 days";
  return {
    source: "heuristic",
    reply: isAr
      ? `مسودة من الكتالوج${grounded?.name ? ` («${grounded.name}»)` : ""}: سعر وحدة ~${unitHint} ر.س، كمية ${qty}، مهلة ${lead}، صلاحية 14 يوماً. راجع قبل الإرسال — لن أرسل نيابة عنك.`
      : `Catalogue-grounded draft${grounded?.name ? ` (“${grounded.name}”)` : ""}: unit ~${unitHint} SAR, qty ${qty}, lead ${lead}, validity 14 days. Review before submit — I never auto-send.`,
    draft: {
      unitPrice: unitHint,
      quantity: qty,
      leadTime: lead,
      validityDays: 14,
      sku: grounded?.sku || undefined,
      productName: grounded?.name || undefined,
      groundedFromCatalogue: Boolean(grounded),
      notes: isAr
        ? "يشمل التوريد داخل السعودية. السعر قابل للتفاوض حسب الكمية. ضريبة القيمة المضافة 15٪ تُذكر صراحة."
        : "Includes Saudi delivery. Price negotiable by volume. State 15% VAT explicitly.",
      paymentTerms: "Net 30 / advance on first order",
      vatIncluded: false,
    },
    followUps: isAr
      ? ["اقترح ملاحظة احترافية للعرض", "ما المهلة المناسبة؟"]
      : ["Suggest professional quote notes", "What lead time should I offer?"],
  };
}

export async function runQuoteAgent(opts: {
  role: "buyer" | "seller";
  message: string;
  locale?: string;
  context?: Record<string, unknown>;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<QuoteAgentReply> {
  const message = String(opts.message || "").trim().slice(0, 2000);
  const locale = opts.locale === "ar" ? "ar" : "en";
  if (!message) return { reply: "Please type a message.", source: "heuristic" };

  if (aiProvider.isConfigured()) {
    try {
      const system =
        opts.role === "buyer"
          ? `You are Hukum's buyer RFQ/quotation agent.
Help clarify requirements, draft RFQ text, and guide accept/reject of seller quotes.
Never invent private vendor contacts. Keep answers short. Locale: ${locale}.`
          : `You are Hukum's seller quotation agent.
Help draft competitive quotes (price, lead time, validity, notes) for invited RFQs.
Never auto-submit. Keep answers short. Locale: ${locale}.`;
      const messages: ChatMessage[] = [
        { role: "system", content: system },
        ...(opts.history || []).slice(-6).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content.slice(0, 800),
        })),
        {
          role: "user",
          content: `Context: ${JSON.stringify(opts.context || {})}\n\nUser: ${message}`,
        },
      ];
      const result = await gatewayComplete({
        feature: "quote_assistant",
        userId: opts.context?.userId ? String(opts.context.userId) : null,
        messages,
        temperature: 0.4,
        allowFallback: true,
        meta: { role: opts.role, neverAutoSend: true },
      });
      const reply = (result.content || "").trim();
      if (reply) {
        const draft =
          opts.role === "seller" ? heuristicSeller(message, locale, opts.context).draft : undefined;
        return {
          reply,
          draft,
          source: "ai",
          followUps: heuristicBuyer(message, locale).followUps,
        };
      }
    } catch {
      /* search/heuristic fallback — never auto-send */
    }
  }

  return opts.role === "seller"
    ? heuristicSeller(message, locale, opts.context)
    : heuristicBuyer(message, locale);
}
