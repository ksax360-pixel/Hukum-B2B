/**
 * Meta WhatsApp Cloud API — production-ready adapter.
 * Activate when META_WA_TOKEN + META_WA_PHONE_NUMBER_ID are set after verification.
 */

import type { MessagingChannel } from "@/lib/integrations";
import { withinWhatsAppWindow } from "@/modules/ai/hukum/guardrails";

export type WaSendResult = { id: string; mode: "freeform" | "template" | "stub" };

function configured() {
  return Boolean(process.env.META_WA_TOKEN && process.env.META_WA_PHONE_NUMBER_ID);
}

export function isWhatsAppConfigured() {
  return configured();
}

export function getWhatsAppVerifyToken() {
  return process.env.META_WA_VERIFY_TOKEN || "hukum-wa-verify";
}

async function graphSend(payload: Record<string, unknown>): Promise<WaSendResult> {
  const phoneId = process.env.META_WA_PHONE_NUMBER_ID!;
  const token = process.env.META_WA_TOKEN!;
  const version = process.env.META_WA_API_VERSION || "v21.0";
  const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as { messages?: Array<{ id?: string }>; error?: { message?: string } };
  if (!res.ok) {
    throw Object.assign(new Error(json.error?.message || "WhatsApp send failed"), { status: 502, details: json });
  }
  return { id: json.messages?.[0]?.id || `wa_${Date.now()}`, mode: "freeform" };
}

/** Free-form text only inside 24h customer-care window. */
export async function sendWhatsAppText(opts: {
  to: string;
  body: string;
  lastInboundAt?: Date | string | null;
}): Promise<WaSendResult> {
  const { hashPhone } = await import("@/modules/risk/contact-gate");
  const { recordWaSend } = await import("@/modules/risk/wa-cost");
  if (!configured()) {
    console.info("[whatsapp] stub send →", opts.to, opts.body.slice(0, 80));
    const stub = { id: `stub_${Date.now()}`, mode: "stub" as const };
    await recordWaSend({ toHash: hashPhone(opts.to), mode: "stub", messageId: stub.id });
    return stub;
  }
  if (!withinWhatsAppWindow(opts.lastInboundAt)) {
    return sendWhatsAppTemplate({
      to: opts.to,
      templateName: process.env.META_WA_DEFAULT_TEMPLATE || "hukum_followup",
      languageCode: "en",
      bodyParams: [opts.body.slice(0, 200)],
    });
  }
  const to = opts.to.replace(/\D/g, "");
  const result = await graphSend({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { preview_url: false, body: opts.body.slice(0, 4096) },
  });
  await recordWaSend({ toHash: hashPhone(opts.to), mode: "freeform", messageId: result.id });
  return result;
}

/** Approved template outside the 24h window. */
export async function sendWhatsAppTemplate(opts: {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParams?: string[];
}): Promise<WaSendResult> {
  const { hashPhone } = await import("@/modules/risk/contact-gate");
  const { recordWaSend } = await import("@/modules/risk/wa-cost");
  if (!configured()) {
    console.info("[whatsapp] stub template →", opts.to, opts.templateName);
    const stub = { id: `stub_tpl_${Date.now()}`, mode: "stub" as const };
    await recordWaSend({
      toHash: hashPhone(opts.to),
      mode: "stub",
      templateName: opts.templateName,
      messageId: stub.id,
    });
    return stub;
  }
  const to = opts.to.replace(/\D/g, "");
  const components =
    opts.bodyParams?.length
      ? [
          {
            type: "body",
            parameters: opts.bodyParams.map((text) => ({ type: "text", text })),
          },
        ]
      : undefined;
  const result = await graphSend({
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: opts.templateName,
      language: { code: opts.languageCode || "en" },
      ...(components ? { components } : {}),
    },
  });
  const out = { ...result, mode: "template" as const };
  await recordWaSend({
    toHash: hashPhone(opts.to),
    mode: "template",
    templateName: opts.templateName,
    messageId: out.id,
  });
  return out;
}

export class WhatsAppCloudChannel implements MessagingChannel {
  async send(to: string, body: string, meta?: Record<string, unknown>): Promise<{ id: string }> {
    const lastInboundAt = (meta?.lastInboundAt as string | undefined) || null;
    const useTemplate = Boolean(meta?.forceTemplate);
    if (useTemplate) {
      return sendWhatsAppTemplate({
        to,
        templateName: String(meta?.templateName || process.env.META_WA_DEFAULT_TEMPLATE || "hukum_followup"),
        languageCode: String(meta?.languageCode || "en"),
        bodyParams: [body.slice(0, 200)],
      });
    }
    return sendWhatsAppText({ to, body, lastInboundAt });
  }
}

export function parseWhatsAppWebhook(body: unknown): Array<{
  waId: string;
  phone: string;
  text: string;
  messageId: string;
  timestamp?: string;
}> {
  const out: Array<{ waId: string; phone: string; text: string; messageId: string; timestamp?: string }> = [];
  const root = body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{
            from?: string;
            id?: string;
            timestamp?: string;
            type?: string;
            text?: { body?: string };
          }>;
          contacts?: Array<{ wa_id?: string }>;
        };
      }>;
    }>;
  };
  for (const entry of root.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      for (const msg of value?.messages || []) {
        if (msg.type !== "text" || !msg.text?.body) continue;
        const phone = msg.from || "";
        out.push({
          waId: phone,
          phone: phone.startsWith("+") ? phone : `+${phone}`,
          text: msg.text.body,
          messageId: msg.id || `wa_${Date.now()}`,
          timestamp: msg.timestamp,
        });
      }
    }
  }
  return out;
}
