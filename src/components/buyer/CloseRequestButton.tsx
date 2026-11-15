"use client";
// Closes a buyer's request after a confirm, so suppliers stop pricing it.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { ask, toast } from "@/components/ui/Feedback";

export function CloseRequestButton({ locale, id }: { locale: string; id: string }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const close = async () => {
    const { ok } = await ask({
      title: L("Close this request?", "تقفل هذا الطلب؟"),
      body: L("Suppliers stop pricing it and won't send new quotes. Quotes you already have stay here.", "الموردون يوقفون التسعير وما يرسلون عروض جديدة. العروض اللي وصلت تبقى هنا."),
      confirmLabel: L("Close request", "اقفل الطلب"),
      cancelLabel: L("Keep it open", "خله مفتوح"),
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const j = await (await fetch("/api/rfqs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set_status", id, status: "closed" }) })).json();
      if (!j.success) throw new Error(j.message);
      toast(L("Request closed.", "تم قفل الطلب."), "success");
      router.push(`/${locale}/buyer/rfqs?tab=closed&id=${id}`);
      router.refresh();
    } catch {
      toast(L("Couldn't close it. Try again.", "تعذّر القفل. حاول مرة ثانية."), "error");
    } finally {
      setBusy(false);
    }
  };
  return <button type="button" className="qb-pass" onClick={close} disabled={busy}><XCircle size={15} aria-hidden /> {L("Close request", "اقفل الطلب")}</button>;
}
