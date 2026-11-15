"use client";
// One-click status actions on a catalogue row: send a draft for review, hide or show a product.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Send } from "lucide-react";
import { toast } from "@/components/ui/Feedback";

export function ProductRowActions({ locale, id, status, ready }: { locale: string; id: string; status: string; ready: boolean }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const setStatus = async (next: string, done: string) => {
    setBusy(true);
    try {
      const j = await (await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, updates: { status: next } }) })).json();
      if (!j.success) throw new Error(j.message);
      toast(done, "success");
      router.refresh();
    } catch {
      toast(L("Couldn't update. Try again.", "تعذّر التحديث. حاول مرة ثانية."), "error");
    } finally {
      setBusy(false);
    }
  };

  if (status === "draft" || status === "changes_requested" || status === "rejected") {
    return (
      <button type="button" className="vpr-act" disabled={busy || !ready} title={ready ? undefined : L("Finish the listing first", "أكمل المنتج أول")} onClick={() => setStatus("submitted", L("Sent for review.", "أُرسل للمراجعة."))}>
        <Send size={15} aria-hidden /> {L("Send for review", "أرسل للمراجعة")}
      </button>
    );
  }
  if (status === "archived") {
    return (
      <button type="button" className="vpr-act" disabled={busy} onClick={() => setStatus("submitted", L("Sent for review. It shows again once approved.", "أُرسل للمراجعة. يظهر بعد الموافقة."))}>
        <Eye size={15} aria-hidden /> {L("Show again", "أظهره")}
      </button>
    );
  }
  if (status === "published" || status === "approved") {
    return (
      <button type="button" className="vpr-act is-quiet" disabled={busy} onClick={() => setStatus("archived", L("Hidden from buyers.", "مخفي عن المشترين."))}>
        <EyeOff size={15} aria-hidden /> {L("Hide", "إخفاء")}
      </button>
    );
  }
  return <span className="vpr-act is-none" aria-hidden />;
}
