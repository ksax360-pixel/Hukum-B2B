"use client";
// Approve or send back a supplier's storefront change. Sending back needs a reason the supplier will see.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Undo2 } from "lucide-react";
import { ask, toast } from "@/components/ui/Feedback";

export function StorefrontReviewActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const send = async (decision: "approve" | "reject", reason = "") => {
    setBusy(true);
    try {
      const j = await (await fetch("/api/vendors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "storefront_review", id, decision, reason }) })).json();
      if (!j.success) throw new Error(j.message);
      toast(decision === "approve" ? `${name}: live now.` : `${name}: sent back with your note.`, "success");
      router.refresh();
    } catch (e) {
      toast((e as Error).message || "Couldn't save. Try again.", "error");
      setBusy(false);
    }
  };
  const reject = async () => {
    const r = await ask({
      title: `Send ${name}'s changes back?`,
      body: "The live page stays as it is. The supplier sees your note and can send again.",
      confirmLabel: "Send back",
      tone: "danger",
      reason: { label: "What should they change?", required: true, presets: ["Cover image is low quality or unrelated", "Logo is not the company's own", "Contact details in the tagline", "Wording is misleading"] },
    });
    if (r.ok) await send("reject", r.reason);
  };
  return (
    <div className="ar-act">
      <button type="button" className="qb-send" disabled={busy} onClick={() => send("approve")}><Check size={16} aria-hidden /> Approve</button>
      <button type="button" className="bh-btn" disabled={busy} onClick={reject}><Undo2 size={15} aria-hidden /> Ask for changes</button>
    </div>
  );
}
