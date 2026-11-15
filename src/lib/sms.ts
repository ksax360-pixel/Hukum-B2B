/**
 * OTP delivery adapter.
 * Priority:
 *  1) Meta WhatsApp AUTH template (same WABA as Electi / x-360) when META_WA_* set
 *  2) SMS_PROVIDER webhook (e.g. n8n)
 *  3) Console stub
 */

export type SmsPayload = {
  to: string;
  body: string;
  purpose?: string;
  /** Explicit OTP digits — required for WhatsApp AUTH templates. */
  code?: string;
};
export type SmsResult = { id: string; mode: "whatsapp" | "provider" | "stub" };

export function isSmsConfigured() {
  return Boolean(
    (process.env.META_WA_TOKEN || process.env.WHATSAPP_TOKEN) &&
      (process.env.META_WA_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID)
  ) || Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY && process.env.SMS_API_URL);
}

function extractCode(body: string, explicit?: string) {
  if (explicit && /^\d{4,8}$/.test(explicit)) return explicit;
  const m = String(body || "").match(/\b(\d{4,8})\b/);
  return m?.[1] || "";
}

async function sendWhatsappAuthOtp(to: string, code: string): Promise<SmsResult | null> {
  const token = (process.env.META_WA_TOKEN || process.env.WHATSAPP_TOKEN || "").trim();
  const phoneId = (
    process.env.META_WA_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    ""
  ).trim();
  if (!token || !phoneId || !code) return null;

  const version = process.env.META_WA_API_VERSION || process.env.WHATSAPP_GRAPH_VERSION || "v22.0";
  const template =
    process.env.META_WA_OTP_TEMPLATE || process.env.WHATSAPP_OTP_TEMPLATE || "llb_otp";
  const language =
    process.env.META_WA_OTP_LANG ||
    process.env.WHATSAPP_OTP_LANG ||
    (template === "verification" ? "en_US" : "en");

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: template,
      language: { code: language },
      components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: code }],
        },
      ],
    },
  };

  const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string; code?: number };
  };
  if (!res.ok) {
    throw Object.assign(new Error(json.error?.message || `WhatsApp OTP ${res.status}`), {
      status: res.status,
      details: json,
    });
  }
  return { id: json.messages?.[0]?.id || `wa_otp_${Date.now()}`, mode: "whatsapp" };
}

export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  const to = String(payload.to || "").replace(/\D/g, "");
  if (!to) return { id: `sms_skip_${Date.now()}`, mode: "stub" };

  const code = extractCode(payload.body, payload.code);
  const sender = process.env.SMS_SENDER_ID || "HUKUM";

  // 1) Direct Meta AUTH template (shared Electi / Hukum account)
  if (code) {
    try {
      const wa = await sendWhatsappAuthOtp(to, code);
      if (wa) return wa;
    } catch (e) {
      console.warn("[sms] whatsapp auth otp error", (e as Error).message);
    }
  }

  // 2) Optional n8n / SMS provider webhook
  const provider = process.env.SMS_PROVIDER;
  const key = process.env.SMS_API_KEY;
  const endpoint = process.env.SMS_API_URL;
  if (provider && key && endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          from: sender,
          body: payload.body,
          code: code || undefined,
          purpose: payload.purpose || "otp",
          channel: "whatsapp",
          template: process.env.META_WA_OTP_TEMPLATE || "llb_otp",
          language: process.env.META_WA_OTP_LANG || "en",
        }),
      });
      if (!res.ok) throw new Error(`SMS ${res.status}`);
      const json = (await res.json().catch(() => ({}))) as { id?: string };
      return { id: json.id || `sms_${Date.now()}`, mode: "provider" };
    } catch (e) {
      console.warn("[sms] provider error", (e as Error).message);
    }
  }

  console.info("[sms] stub →", to, "|", payload.body.slice(0, 80), "| sender", sender);
  return { id: `stub_sms_${Date.now()}`, mode: "stub" };
}
