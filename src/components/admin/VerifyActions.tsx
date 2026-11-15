"use client";
// Verify, reject or pause a supplier. Rejecting or pausing needs a reason the supplier sees.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Ban, X } from "lucide-react";
import { ask, toast } from "@/components/ui/Feedback";

export function VerifyActions({ id, name, status }: { id: string; name: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const send = async (next: string, reason = "") => {
    setBusy(true);
    try {
      const j = await (await fetch("/api/vendors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", id, status: next, reason }) })).json();
      if (!j.success) throw new Error(j.message);
      toast(next === "verified" ? `${name} is verified.` : next === "rejected" ? `${name}: sent back.` : `${name} is paused.`, "success");
      router.refresh();
    } catch (e) {
      toast((e as Error).message || "Couldn't save.", "error");
      setBusy(false);
    }
  };
  const withReason = async (next: "rejected" | "suspended") => {
    const r = await ask({
      title: next === "rejected" ? `Not verify ${name}?` : `Pause ${name}?`,
      body: next === "rejected" ? "They see your reason and can correct their details and send again." : "Their storefront and products are hidden from buyers until you lift it.",
      confirmLabel: next === "rejected" ? "Send back" : "Pause supplier",
      tone: "danger",
      reason: {
        label: "Reason the supplier will see",
        required: true,
        presets: next === "rejected" ? ["CR number not found on Wathq", "CR name doesn't match the company name", "VAT number not found on ZATCA", "CR is expired"] : ["Reported by buyers", "Misleading listings", "Contact details posted to bypass Hukum"],
      },
    });
    if (r.ok) await send(next, r.reason);
  };
  return (
    <span className="va-act">
      {status !== "verified" ? <button type="button" className="vpr-act va-ok" disabled={busy} onClick={() => send("verified")}><BadgeCheck size={15} aria-hidden /> Verify</button> : null}
      {status === "pending" ? <button type="button" className="vpr-act" disabled={busy} onClick={() => withReason("rejected")}><X size={15} aria-hidden /> Send back</button> : null}
      {status !== "suspended" ? <button type="button" className="vpr-act is-quiet" disabled={busy} onClick={() => withReason("suspended")}><Ban size={15} aria-hidden /> Pause</button> : null}
    </span>
  );
}
