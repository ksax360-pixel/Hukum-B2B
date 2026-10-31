"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

type ReviewRow = {
  _id: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
  moderationStatus?: string;
};

type Props = {
  locale: "en" | "ar";
  productId: string;
  averageHint?: number | null;
  countHint?: number | null;
};

export function ProductReviews({ locale, productId, averageHint, countHint }: Props) {
  const isAr = locale === "ar";
  const [items, setItems] = useState<ReviewRow[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/platform?resource=reviews&targetId=${encodeURIComponent(productId)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setItems(json.data);
    } catch {
      /* ignore */
    }
  }, [productId]);

  useEffect(() => {
    void load();
    void fetch("/api/auth", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setAuthed(Boolean(j.success && (j.data?.session || j.data?.user))))
      .catch(() => setAuthed(false));
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "review",
          targetType: "product",
          targetId: productId,
          rating,
          comment,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setMsg(json.message || (isAr ? "فشل الإرسال" : "Submit failed"));
        return;
      }
      setComment("");
      setMsg(isAr ? "تم إرسال التقييم للمراجعة." : "Review submitted for moderation.");
      void load();
    } catch {
      setMsg(isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setBusy(false);
    }
  }

  const avg =
    items.length > 0
      ? items.reduce((s, r) => s + (Number(r.rating) || 0), 0) / items.length
      : averageHint;

  return (
    <div className="space-y-4">
      <p className="m-0 text-sm text-[#6b6b6b]">
        {avg != null
          ? isAr
            ? `متوسط ${avg.toFixed(1)} · ${items.length || countHint || 0} تقييم`
            : `Average ${avg.toFixed(1)} · ${items.length || countHint || 0} reviews`
          : isAr
            ? "لا توجد تقييمات منشورة بعد."
            : "No published reviews yet."}
      </p>

      <ul className="m-0 space-y-3 p-0 list-none">
        {items.map((r) => (
          <li key={r._id} className="rounded-lg border border-[#eee] bg-transparent p-3">
            <div className="flex items-center gap-1 text-[#c9a962]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  fill={i < (r.rating || 0) ? "currentColor" : "none"}
                  className={i < (r.rating || 0) ? "" : "text-[#ddd]"}
                />
              ))}
            </div>
            <p className="mt-1 mb-0 text-sm text-[#1a1612]">{r.comment || "—"}</p>
          </li>
        ))}
      </ul>

      {authed ? (
        <form onSubmit={submit} className="rounded-lg border border-[#e6e2da] p-3">
          <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">
            {isAr ? "اكتب تقييمك" : "Leave a review"}
          </p>
          <div className="mb-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={n <= rating ? "text-[#c9a962]" : "text-[#ddd]"}
              >
                <Star size={18} fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            required
            className="w-full rounded-md border border-[#e6e2da] px-2.5 py-2 text-sm"
            placeholder={isAr ? "تجربتك مع المنتج والمورد…" : "Your experience with product & supplier…"}
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-lg bg-[#c9a962] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {busy ? (isAr ? "جارٍ…" : "Sending…") : isAr ? "إرسال" : "Submit"}
          </button>
          {msg ? <p className="mt-2 mb-0 text-xs text-[#5c5c5c]">{msg}</p> : null}
        </form>
      ) : (
        <p className="m-0 text-sm text-[#6b6b6b]">
          <Link href={`/${locale}/login?next=/${locale}/products`} className="font-semibold text-[#c9a962]">
            {isAr ? "سجّل الدخول" : "Sign in"}
          </Link>{" "}
          {isAr ? "لكتابة تقييم." : "to leave a review."}
        </p>
      )}
    </div>
  );
}
