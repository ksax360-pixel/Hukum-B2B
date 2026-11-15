"use client";
// Removes a saved product or supplier and refreshes the list.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "@/components/ui/Feedback";

export function UnsaveButton({ locale, kind, id }: { locale: string; kind: "product" | "vendor"; id: string }) {
  const isAr = locale === "ar";
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    setBusy(true);
    try {
      const j = await (await fetch("/api/platform", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: `unsave_${kind}`, [`${kind}Id`]: id }) })).json();
      if (!j.success) throw new Error(j.message);
      router.refresh();
    } catch {
      toast(isAr ? "تعذّر الحذف. حاول مرة ثانية." : "Couldn't remove it. Try again.", "error");
      setBusy(false);
    }
  };
  return (
    <button type="button" className="sv-remove" onClick={remove} disabled={busy}>
      <X size={14} aria-hidden /> {isAr ? "إزالة" : "Remove"}
    </button>
  );
}
