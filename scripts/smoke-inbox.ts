import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { User } from "../src/modules/users/user.model";
import { Vendor } from "../src/modules/vendors/vendor.model";
import {
  findOrCreateBuyerSupplierThread,
  createSupportThread,
  postMessage,
  revealContactsInThread,
  handoverSupportThread,
  syncWhatsAppIntoThread,
} from "../src/modules/messaging/thread-service";
import {
  moderateMessageBody,
  scanAttachmentStub,
  isOptOutText,
  translateMessageStub,
} from "../src/modules/messaging/inbox-safety";
import { Message, Conversation } from "../src/modules/platform/platform.model";

async function main() {
  console.log("safety", {
    spam: moderateMessageBody("crypto giveaway http://a http://b http://c http://d"),
    leak: moderateMessageBody("call me 0512345678"),
    exe: scanAttachmentStub({ name: "payload.exe" }),
    pdf: scanAttachmentStub({ name: "quote.pdf", mime: "application/pdf", size: 1000 }),
    optOut: isOptOutText("STOP"),
  });
  console.log("translate", await translateMessageStub("Hello supplier", "ar"));

  await connectDB();
  const buyer = await User.findOne({}).select("_id email").lean();
  const vendor = await Vendor.findOne({}).select("_id ownerUserId").lean();
  if (!buyer || !vendor?.ownerUserId) throw new Error("Need user + vendor");

  const thread = await findOrCreateBuyerSupplierThread({
    buyerUserId: String(buyer._id),
    sellerUserId: String(vendor.ownerUserId),
    vendorId: String(vendor._id),
    rfqId: new mongoose.Types.ObjectId().toString(),
    subject: "[Inbox Smoke] Need valves",
  });
  console.log("1. buyer_supplier thread", String(thread._id), thread.threadType, thread.needKey);

  const again = await findOrCreateBuyerSupplierThread({
    buyerUserId: String(buyer._id),
    sellerUserId: String(vendor.ownerUserId),
    vendorId: String(vendor._id),
    rfqId: String((thread as { rfqId?: unknown }).rfqId || ""),
    subject: "[Inbox Smoke] Need valves",
  });
  console.log("2. one-per-need dedupe", String(again._id) === String(thread._id));

  const { message } = await postMessage({
    conversationId: String(thread._id),
    senderId: String(buyer._id),
    body: "Please quote 10 valves. My email is buyer@example.com for now.",
    translateTo: "ar",
  });
  console.log("3. contact gate stripped?", message.body.includes("[contact hidden"), "translated?", !!message.bodyTranslated);

  await revealContactsInThread({ conversationId: String(thread._id), userId: String(buyer._id) });
  const { message: m2 } = await postMessage({
    conversationId: String(thread._id),
    senderId: String(buyer._id),
    body: "Email ok now: buyer@example.com",
  });
  console.log("4. after reveal keeps email?", m2.body.includes("buyer@example.com"));

  const support = await createSupportThread({
    userId: String(buyer._id),
    topic: "[Inbox Smoke] Dispute",
    body: "Need concierge help on delivery",
    locale: "en",
  });
  console.log("5. support", support.ticket.ticketKey, "SLA", support.ticket.slaDueAt);

  // Fake second user for handover — use vendor owner
  await handoverSupportThread({
    conversationId: String(support.conversation._id),
    fromUserId: String(buyer._id),
    toUserId: String(vendor.ownerUserId),
    note: "Handing with full context",
  });
  const supportMsgs = await Message.find({ conversationId: support.conversation._id }).lean();
  console.log("6. handover system msgs", supportMsgs.filter((m) => m.kind === "system").length);

  const sync = await syncWhatsAppIntoThread({
    phone: "+966500000001",
    userId: String(buyer._id),
    text: "Hello from WA",
    waMessageId: "wamid.smoke",
    direction: "inbound",
  });
  console.log("7. WA sync", sync && "conversation" in sync ? String(sync.conversation._id) : sync);

  const count = await Conversation.countDocuments({
    subject: /Inbox Smoke|WhatsApp/,
  });
  console.log("8. conversations touched", count);
  console.log("\n✅ Inbox smoke OK");
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("❌", e);
  try {
    await mongoose.disconnect();
  } catch {
    /* */
  }
  process.exit(1);
});
