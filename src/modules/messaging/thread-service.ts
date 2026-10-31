/**
 * Hukum chat & inbox — thread helpers (buyer–supplier, support, WhatsApp sync).
 */
import {
  Conversation,
  Message,
  Notification,
  SupportTicket,
  InboxBlock,
} from "@/modules/platform/platform.model";
import {
  defaultRetentionUntil,
  detectLocale,
  moderateMessageBody,
  scanAttachmentStub,
  slaDueFromNow,
  translateMessageStub,
} from "@/modules/messaging/inbox-safety";

export function needKeyFrom(opts: {
  rfqId?: string;
  quotationId?: string;
  needKey?: string;
  subject?: string;
}) {
  if (opts.needKey) return String(opts.needKey).slice(0, 120);
  if (opts.rfqId) return `rfq:${opts.rfqId}`;
  if (opts.quotationId) return `quote:${opts.quotationId}`;
  if (opts.subject) return `sub:${opts.subject.toLowerCase().replace(/\s+/g, "-").slice(0, 80)}`;
  return "general";
}

export async function assertNotBlocked(blockerId: string, otherUserId: string, vendorId?: string) {
  const q: Record<string, unknown>[] = [
    { blockerId, blockedUserId: otherUserId },
    { blockerId: otherUserId, blockedUserId: blockerId },
  ];
  if (vendorId) q.push({ blockerId, blockedVendorId: vendorId });
  const hit = await InboxBlock.findOne({ $or: q }).lean();
  if (hit) throw Object.assign(new Error("Messaging blocked"), { status: 403 });
}

export async function findOrCreateBuyerSupplierThread(opts: {
  buyerUserId: string;
  sellerUserId: string;
  vendorId?: string;
  rfqId?: string;
  quotationId?: string;
  needKey?: string;
  subject?: string;
}) {
  const key = needKeyFrom(opts);
  const participants = Array.from(new Set([opts.buyerUserId, opts.sellerUserId]));
  const existing = await Conversation.findOne({
    threadType: "buyer_supplier",
    participants: { $all: participants },
    needKey: key,
    ...(opts.vendorId ? { vendorId: opts.vendorId } : {}),
    status: { $ne: "archived" },
  });
  if (existing) return existing;

  return Conversation.create({
    participants,
    vendorId: opts.vendorId || undefined,
    rfqId: opts.rfqId || undefined,
    quotationId: opts.quotationId || undefined,
    needKey: key,
    subject: opts.subject || "RFQ discussion",
    threadType: "buyer_supplier",
    contactGate: { contactsShared: false, mode: "relay" },
    retentionUntil: defaultRetentionUntil(),
    lastMessageAt: new Date(),
  });
}

export async function createSupportThread(opts: {
  userId: string;
  requesterLabel?: string;
  topic: string;
  body: string;
  hukumSessionId?: string;
  contextSnapshot?: Record<string, unknown>;
  locale?: "en" | "ar";
}) {
  const isAr = opts.locale === "ar";
  const count = await SupportTicket.countDocuments();
  const ticketKey = `KT-${1000 + count + 1}`;
  const slaDueAt = slaDueFromNow(4);

  const conversation = await Conversation.create({
    participants: [opts.userId],
    subject: opts.topic,
    threadType: "support",
    status: "open",
    retentionUntil: defaultRetentionUntil(),
    sla: {
      dueAt: slaDueAt,
      status: "ok",
      hukumSessionId: opts.hukumSessionId || undefined,
    },
    lastMessageAt: new Date(),
    lastMessagePreview: opts.body.slice(0, 120),
  });

  const ticket = await SupportTicket.create({
    ticketKey,
    topic: opts.topic,
    body: opts.body,
    category: "Hukum concierge",
    urgency: "High",
    requester: opts.requesterLabel || "Buyer",
    createdBy: opts.userId,
    roleScope: "buyer",
    conversationId: conversation._id,
    hukumSessionId: opts.hukumSessionId || undefined,
    slaDueAt,
    contextSnapshot: opts.contextSnapshot || {},
  });

  conversation.set("sla.ticketId", ticket._id);
  await conversation.save();

  await Message.create({
    conversationId: conversation._id,
    senderRole: "system",
    body: isAr
      ? `تم فتح تذكرة الدعم ${ticketKey}. هدف الرد خلال 4 ساعات (SLA).`
      : `Support ticket ${ticketKey} opened. Target first response within 4 hours (SLA).`,
    kind: "system",
    channel: "in_app",
    moderationStatus: "ok",
  });

  await Message.create({
    conversationId: conversation._id,
    senderId: opts.userId,
    senderRole: "user",
    body: opts.body,
    kind: "text",
    channel: "web",
  });

  return { conversation, ticket };
}

export async function handoverSupportThread(opts: {
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  note?: string;
}) {
  const conversation = await Conversation.findById(opts.conversationId);
  if (!conversation || conversation.threadType !== "support") {
    throw Object.assign(new Error("Support thread not found"), { status: 404 });
  }
  const participants = new Set(conversation.participants.map(String));
  participants.add(opts.toUserId);
  conversation.participants = Array.from(participants) as typeof conversation.participants;
  conversation.set("sla.handedOverFrom", opts.fromUserId);
  conversation.set("sla.handedOverTo", opts.toUserId);
  conversation.set("sla.handedOverAt", new Date());
  conversation.set("sla.assignedTo", opts.toUserId);
  await conversation.save();

  if (conversation.sla?.ticketId) {
    await SupportTicket.findByIdAndUpdate(conversation.sla.ticketId, {
      assignedTo: opts.toUserId,
      handedOverFrom: opts.fromUserId,
      handedOverTo: opts.toUserId,
      handedOverAt: new Date(),
      status: "In Progress",
    });
  }

  await Message.create({
    conversationId: conversation._id,
    senderRole: "system",
    body: opts.note || `Handed over with full context to agent ${opts.toUserId.slice(-6)}.`,
    kind: "system",
    meta: { handover: true, from: opts.fromUserId, to: opts.toUserId },
  });

  return conversation;
}

export async function postMessage(opts: {
  conversationId: string;
  senderId: string;
  body: string;
  attachments?: Array<string | { url?: string; name?: string; mime?: string; size?: number }>;
  kind?: "text" | "quote_card" | "system" | "file" | "voice";
  channel?: "in_app" | "whatsapp" | "web";
  meta?: Record<string, unknown>;
  translateTo?: "en" | "ar";
  waMessageId?: string;
  /** When true, strip leaked contacts unless contact gate open */
  enforceContactGate?: boolean;
}) {
  const conversation = await Conversation.findById(opts.conversationId);
  if (!conversation) throw Object.assign(new Error("Conversation not found"), { status: 404 });
  if (!conversation.participants.map(String).includes(opts.senderId) && opts.kind !== "system") {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  const others = conversation.participants.map(String).filter((id) => id !== opts.senderId);
  for (const o of others) {
    await assertNotBlocked(opts.senderId, o, conversation.vendorId ? String(conversation.vendorId) : undefined);
  }

  let body = String(opts.body || "").slice(0, 8000);
  const mod = moderateMessageBody(body);
  if (mod.status === "blocked") {
    throw Object.assign(new Error("Message blocked by safety filter"), { status: 422, reasons: mod.reasons });
  }

  const gateOpen = Boolean(conversation.contactGate?.contactsShared);
  if (opts.enforceContactGate !== false && !gateOpen && mod.strippedContacts) {
    body = body.replace(
      /(\+?966[\s-]?\d{8,9}|\b05\d{8}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi,
      "[contact hidden until mutual accept]"
    );
  }

  const attachments = (opts.attachments || []).map((a) => {
    const file =
      typeof a === "string"
        ? { url: a, name: a.split("/").pop() }
        : a;
    return {
      ...file,
      scanStatus: scanAttachmentStub(file),
    };
  });
  if (attachments.some((a) => a.scanStatus === "blocked")) {
    throw Object.assign(new Error("Attachment blocked by malware scan"), { status: 422 });
  }

  let bodyTranslated: string | undefined;
  if (opts.translateTo) {
    const t = await translateMessageStub(body, opts.translateTo);
    bodyTranslated = t.translated;
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: opts.senderId,
    senderRole: "user",
    body,
    bodyTranslated,
    bodySourceLocale: detectLocale(body),
    kind: opts.kind || (attachments.length ? "file" : "text"),
    channel: opts.channel || "in_app",
    attachments,
    readBy: [opts.senderId],
    waMessageId: opts.waMessageId,
    moderationStatus: mod.status,
    meta: { ...(opts.meta || {}), safety: mod.reasons },
  });

  conversation.lastMessageAt = new Date();
  conversation.lastMessagePreview = body.slice(0, 140);
  conversation.updatedAt = new Date();
  await conversation.save();

  for (const uid of others) {
    await Notification.create({
      userId: uid,
      type: "message_received",
      title: { en: "New message", ar: "رسالة جديدة" },
      body: { en: body.slice(0, 120), ar: body.slice(0, 120) },
      channel: "in_app",
      meta: { conversationId: String(conversation._id), messageId: String(message._id) },
    }).catch(() => undefined);
  }

  return { message, conversation, moderation: mod };
}

export async function revealContactsInThread(opts: {
  conversationId: string;
  userId: string;
}) {
  const conversation = await Conversation.findById(opts.conversationId);
  if (!conversation) throw Object.assign(new Error("Not found"), { status: 404 });
  if (!conversation.participants.map(String).includes(opts.userId)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  // Mutual accept: both sides must opt in before contactsShared (risk C1/H4)
  const gate = conversation.contactGate || {};
  const prior = Array.isArray((gate as { acceptUserIds?: string[] }).acceptUserIds)
    ? ([...(gate as { acceptUserIds: string[] }).acceptUserIds] as string[])
    : [];
  if (!prior.includes(opts.userId)) prior.push(opts.userId);
  const participants = conversation.participants.map(String);
  const bothAccepted = participants.every((pid) => prior.includes(pid));

  conversation.contactGate = {
    ...gate,
    acceptUserIds: prior,
    contactsShared: bothAccepted,
    sharedAt: bothAccepted ? new Date() : (gate as { sharedAt?: Date }).sharedAt,
    sharedBy: opts.userId as never,
    mode: bothAccepted ? "revealed" : "pending_mutual",
  };
  conversation.markModified("contactGate");
  await conversation.save();

  await Message.create({
    conversationId: conversation._id,
    senderRole: "system",
    body: bothAccepted
      ? "Contact details shared by mutual accept. First contact stayed on Hukum relay. PDPL applies — use only for this deal."
      : "Reveal requested — waiting for the other party to accept (mutual consent).",
    kind: "system",
    meta: { contactGate: bothAccepted ? "revealed" : "pending_mutual", hukumRelay: true },
  });

  const { logContactReveal } = await import("@/modules/risk/contact-gate");
  await logContactReveal({
    type: "inbox_reveal",
    userId: opts.userId,
    vendorId: conversation.vendorId ? String(conversation.vendorId) : undefined,
    via: bothAccepted ? "inbox_mutual" : "inbox_pending",
    channel: "inbox",
    meta: { conversationId: String(conversation._id), bothAccepted },
  });

  return conversation;
}

export async function syncWhatsAppIntoThread(opts: {
  conversationId?: string;
  phone: string;
  userId?: string;
  text: string;
  waMessageId?: string;
  direction: "inbound" | "outbound";
}) {
  let conversation = opts.conversationId
    ? await Conversation.findById(opts.conversationId)
    : await Conversation.findOne({ "whatsapp.linkedPhone": opts.phone, status: "open" });

  if (!conversation && opts.userId) {
    conversation = await Conversation.create({
      participants: [opts.userId],
      subject: "WhatsApp ↔ Hukum",
      threadType: "ai_assistant",
      whatsapp: { linkedPhone: opts.phone, lastSyncedAt: new Date(), optOut: false },
      retentionUntil: defaultRetentionUntil(),
    });
  }
  if (!conversation) return null;
  if (conversation.whatsapp?.optOut) {
    return { conversation, skipped: "opt_out" as const };
  }

  await Message.create({
    conversationId: conversation._id,
    senderId: opts.direction === "inbound" ? opts.userId : undefined,
    senderRole: opts.direction === "inbound" ? "user" : "hukum",
    body: opts.text,
    kind: "text",
    channel: "whatsapp",
    waMessageId: opts.waMessageId,
    bodySourceLocale: detectLocale(opts.text),
  });
  conversation.set("whatsapp.lastSyncedAt", new Date());
  conversation.lastMessageAt = new Date();
  conversation.lastMessagePreview = opts.text.slice(0, 140);
  await conversation.save();
  return { conversation, skipped: null };
}
