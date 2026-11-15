/**
 * Future ERP / WhatsApp / Voice integration adapters.
 * Domain code depends on these interfaces — never on a specific vendor SDK.
 */

import { WhatsAppCloudChannel } from "@/modules/messaging/whatsapp-cloud";

export interface ErpAdapter {
  name: string;
  pushProduct(payload: Record<string, unknown>): Promise<{ externalId: string }>;
  pullInventory(sku: string): Promise<{ qty: number } | null>;
}

export class NoopErpAdapter implements ErpAdapter {
  name = "noop";
  async pushProduct(_payload: Record<string, unknown>): Promise<{ externalId: string }> {
    throw Object.assign(new Error("ERP adapter not configured"), { status: 503 });
  }
  async pullInventory(_sku: string): Promise<{ qty: number } | null> {
    return null;
  }
}

export interface MessagingChannel {
  send(to: string, body: string, meta?: Record<string, unknown>): Promise<{ id: string }>;
}

export class WhatsAppChannelStub implements MessagingChannel {
  async send(_to: string, _body: string, _meta?: Record<string, unknown>): Promise<{ id: string }> {
    throw Object.assign(new Error("WhatsApp channel not configured"), { status: 503 });
  }
}

export class VoiceAssistantStub {
  async handleUtterance(locale: "en" | "ar", text: string): Promise<{ reply: string }> {
    void locale;
    return {
      reply:
        locale === "ar"
          ? `[صوت] استلمت: ${text.slice(0, 120)} — اربط مزود الصوت للإنتاج.`
          : `[Voice] Heard: ${text.slice(0, 120)} — connect voice provider for production.`,
    };
  }

  /** Smart feature stub — voice-note transcription inside threads (2028 roadmap). */
  async transcribe(audioUrl: string, locale: "en" | "ar" = "en"): Promise<{ text: string }> {
    const { transcribeVoiceStub } = await import("@/modules/messaging/inbox-safety");
    return transcribeVoiceStub(audioUrl, locale);
  }
}

export const erpAdapter: ErpAdapter = new NoopErpAdapter();

/** Punchout / Etimad — see `@/modules/procurement/erp-etimad` for buyer tools. */
export type { ErpConnector, EtimadTenderStub } from "@/modules/procurement/erp-etimad";
export {
  listErpConnectors,
  listEtimadFeedStub,
  punchoutHandshakeStub,
} from "@/modules/procurement/erp-etimad";

/** Prefer Meta Cloud adapter when env is present; else stub. */
export function getWhatsAppChannel(): MessagingChannel {
  if (process.env.META_WA_TOKEN && process.env.META_WA_PHONE_NUMBER_ID) {
    return new WhatsAppCloudChannel();
  }
  return new WhatsAppChannelStub();
}

export const whatsappChannel: MessagingChannel = {
  send(to, body, meta) {
    return getWhatsAppChannel().send(to, body, meta);
  },
};
export const voiceAssistant = new VoiceAssistantStub();
