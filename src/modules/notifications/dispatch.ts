/**
 * Multi-channel notification dispatcher (in-app + email + WhatsApp + SMS).
 * Idempotent when meta.key is set. Respects Saudi quiet hours for WA/SMS pushes.
 */

import { connectDB } from "@/lib/db";
import { Notification } from "@/modules/platform/platform.model";
import { User } from "@/modules/users/user.model";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { sendWhatsAppText } from "@/modules/messaging/whatsapp-cloud";
import { canSendReminderNow } from "@/lib/saudi-schedule";
import {
  fillTemplate,
  getMatrixRow,
  type MatrixTrigger,
  type NotifyChannel,
} from "./matrix";

export type DispatchVars = Record<string, string | number | undefined>;

export type DispatchOpts = {
  userId: string;
  trigger: MatrixTrigger;
  vars?: DispatchVars;
  /** Override matrix channels */
  channels?: NotifyChannel[];
  /** Idempotency key stored in meta.key */
  key?: string;
  meta?: Record<string, unknown>;
  phone?: string;
  email?: string;
  /** Force send even in quiet hours (OTP only) */
  force?: boolean;
  locale?: "en" | "ar";
};

export type DispatchResult = {
  trigger: MatrixTrigger;
  channels: NotifyChannel[];
  results: Array<{ channel: NotifyChannel; id?: string; skipped?: string }>;
};

async function resolveContact(userId: string, override?: { email?: string; phone?: string }) {
  if (override?.email && override?.phone) return override;
  const user = await User.findById(userId).select("email mobile name preferredLanguage").lean();
  return {
    email: override?.email || user?.email || "",
    phone: override?.phone || (user as { mobile?: string } | null)?.mobile || "",
    name: user?.name || "",
    preferredLanguage: (user as { preferredLanguage?: string } | null)?.preferredLanguage || "en",
  };
}

export async function dispatchNotification(opts: DispatchOpts): Promise<DispatchResult> {
  await connectDB();
  const row = getMatrixRow(opts.trigger);
  const channels = opts.channels || row.channels;
  const contact = await resolveContact(opts.userId, { email: opts.email, phone: opts.phone });
  const locale = opts.locale || (contact.preferredLanguage === "ar" ? "ar" : "en");
  const vars = {
    name: contact.name ? ` ${contact.name}` : "",
    ...opts.vars,
  };
  const title = {
    en: fillTemplate(row.title.en, vars),
    ar: fillTemplate(row.title.ar, vars),
  };
  const body = {
    en: fillTemplate(row.bodyTemplate.en, vars),
    ar: fillTemplate(row.bodyTemplate.ar, vars),
  };
  const text = locale === "ar" ? body.ar : body.en;

  if (opts.key) {
    const existing = await Notification.findOne({
      userId: opts.userId,
      type: opts.trigger,
      "meta.key": opts.key,
    })
      .select("_id")
      .lean();
    if (existing) {
      return {
        trigger: opts.trigger,
        channels,
        results: channels.map((c) => ({ channel: c, skipped: "idempotent" })),
      };
    }
  }

  const schedule = canSendReminderNow();
  const quietBlock = !opts.force && !schedule.ok && opts.trigger !== "otp";
  const results: DispatchResult["results"] = [];

  for (const channel of channels) {
    try {
      if (channel === "in_app") {
        const doc = await Notification.create({
          userId: opts.userId,
          type: opts.trigger,
          title,
          body,
          channel: "in_app",
          read: false,
          meta: {
            key: opts.key,
            trigger: opts.trigger,
            channels,
            ...(opts.meta || {}),
            ...(quietBlock ? { deferredOutbound: schedule.reason } : {}),
          },
        });
        results.push({ channel, id: String(doc._id) });
        continue;
      }

      if (quietBlock && (channel === "whatsapp" || channel === "sms" || channel === "email")) {
        // Still record intent as channel-tagged notification for audit / later flush
        const doc = await Notification.create({
          userId: opts.userId,
          type: opts.trigger,
          title,
          body,
          channel,
          read: false,
          meta: {
            key: opts.key ? `${opts.key}:${channel}` : undefined,
            trigger: opts.trigger,
            deferred: true,
            reason: schedule.reason,
            deferUntil: schedule.deferUntil?.toISOString(),
            ...(opts.meta || {}),
          },
        });
        results.push({ channel, id: String(doc._id), skipped: schedule.reason || "quiet_hours" });
        continue;
      }

      if (channel === "email") {
        if (!contact.email) {
          results.push({ channel, skipped: "no_email" });
          continue;
        }
        const sent = await sendEmail({
          to: contact.email,
          subject: locale === "ar" ? title.ar : title.en,
          text,
          tags: [opts.trigger],
        });
        await Notification.create({
          userId: opts.userId,
          type: opts.trigger,
          title,
          body,
          channel: "email",
          read: true,
          meta: { key: opts.key ? `${opts.key}:email` : undefined, emailId: sent.id, mode: sent.mode, ...(opts.meta || {}) },
        }).catch(() => undefined);
        results.push({ channel, id: sent.id });
        continue;
      }

      if (channel === "whatsapp") {
        if (!contact.phone) {
          results.push({ channel, skipped: "no_phone" });
          continue;
        }
        const sent = await sendWhatsAppText({ to: contact.phone, body: text });
        await Notification.create({
          userId: opts.userId,
          type: opts.trigger,
          title,
          body,
          channel: "whatsapp",
          read: true,
          meta: { key: opts.key ? `${opts.key}:wa` : undefined, waId: sent.id, mode: sent.mode, ...(opts.meta || {}) },
        }).catch(() => undefined);
        results.push({ channel, id: sent.id });
        continue;
      }

      if (channel === "sms") {
        if (!contact.phone) {
          results.push({ channel, skipped: "no_phone" });
          continue;
        }
        const sent = await sendSms({ to: contact.phone, body: text, purpose: opts.trigger });
        await Notification.create({
          userId: opts.userId,
          type: opts.trigger,
          title,
          body,
          channel: "sms",
          read: true,
          meta: { key: opts.key ? `${opts.key}:sms` : undefined, smsId: sent.id, mode: sent.mode, ...(opts.meta || {}) },
        }).catch(() => undefined);
        results.push({ channel, id: sent.id });
        continue;
      }
    } catch (e) {
      results.push({ channel, skipped: (e as Error).message });
    }
  }

  return { trigger: opts.trigger, channels, results };
}

/** Convenience: record funnel analytics + optional notify */
export async function trackFunnelEvent(opts: {
  type: string;
  userId?: string;
  vendorId?: string;
  productId?: string;
  meta?: Record<string, unknown>;
}) {
  const { recordAnalyticsEvent } = await import("@/lib/analytics");
  await recordAnalyticsEvent({
    type: opts.type,
    userId: opts.userId,
    vendorId: opts.vendorId,
    productId: opts.productId,
    meta: opts.meta,
  }).catch(() => undefined);
}
