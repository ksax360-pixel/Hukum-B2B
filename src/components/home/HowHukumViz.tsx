"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, MessageSquareText, Paperclip } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

type Step = 0 | 1 | 2;

/** One step of the loop. Typing, the send swap and the progress fill all key off this. */
const STEP_MS = 4600;
/** Seconds between letters as text writes itself in. */
const LETTER_S = 0.0495;

/**
 * Text that writes itself in, letter by letter, with no cursor.
 * Arabic goes word by word: splitting Arabic letters into spans breaks how they join.
 */
function Letters({ text, delay, isAr }: { text: string; delay: number; isAr: boolean }) {
  const parts = isAr ? text.split(/(\s+)/) : Array.from(text);
  return (
    <b className="hukum-viz__type" aria-label={text}>
      {parts.map((ch, i) => (
        <span key={i} aria-hidden style={{ animationDelay: `${(delay + i * (isAr ? LETTER_S * 4 : LETTER_S)).toFixed(3)}s` }}>
          {ch}
        </span>
      ))}
    </b>
  );
}

/** Match step: 12 suppliers, 3 filters. `out` is the filter that rules a supplier out (0 = it matches). */
const SUPPLIERS: Array<{ t: string; e: string; out: 0 | 1 | 2 | 3 }> = [
  { t: "وا", e: "WA", out: 0 }, { t: "بن", e: "BN", out: 1 }, { t: "نج", e: "NJ", out: 0 }, { t: "سع", e: "SA", out: 2 },
  { t: "خل", e: "KH", out: 0 }, { t: "مر", e: "MR", out: 1 }, { t: "قص", e: "QS", out: 3 }, { t: "رم", e: "RM", out: 0 },
  { t: "هد", e: "HD", out: 2 }, { t: "طي", e: "TY", out: 1 }, { t: "سد", e: "SD", out: 3 }, { t: "ثر", e: "TH", out: 0 },
];

export function HowHukumViz({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const [step, setStep] = useState<Step>(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  // Start from step one when the panel scrolls into view, so nobody lands mid-story.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return setVisible(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible((was) => {
          if (!was) {
            setStep(0);
            setRun((r) => r + 1); // remount: CSS typing restarts from the first letter
          }
          return true;
        });
      } else setVisible(false);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !visible || paused) return;
    const id = window.setInterval(() => setStep((s) => ((s + 1) % 3) as Step), STEP_MS);
    return () => window.clearInterval(id);
  }, [visible, paused]);

  const labels = isAr
    ? (["اطلب", "طابق", "قارن"] as const)
    : (["Request", "Match", "Compare"] as const);

  return (
    <div
      ref={root}
      className={cn("hukum-viz", paused && "is-paused", !visible && "is-idle")}
      style={{ ["--step" as string]: `${STEP_MS}ms` } as CSSProperties}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-hidden
    >
      <div className="hukum-viz__steps">
        {labels.map((label, i) => (
          <div key={label} className="hukum-viz__step-wrap">
            {i > 0 ? (
              <i className={cn(step > i - 1 ? "is-done" : "", step === i - 1 ? "is-run" : "")}>
                <b key={`${step}-${i}-${run}`} />
              </i>
            ) : null}
            <span className={cn(step >= i && "is-on")}>{label}</span>
          </div>
        ))}
      </div>

      <div className="hukum-viz__stage">
        {step === 0 ? (
          <div className="hukum-viz__panel is-on" key={`request-${run}`}>
            <small>{isAr ? "طلب جديد · نموذج" : "New request · sample"}</small>
            <div className="hukum-viz__form">
              <div className="hukum-viz__field">
                <span>{isAr ? "ماذا تحتاج؟" : "What do you need?"}</span>
                <Letters isAr={isAr} delay={0.28} text={isAr ? "أكواب ورقية 8 أونصة، مطبوعة" : "Paper cups, 8 oz, printed"} />
              </div>
              <div className="hukum-viz__row">
                <div className="hukum-viz__field">
                  <span>{isAr ? "الكمية" : "Quantity"}</span>
                  <Letters isAr={false} delay={1.5} text="3,000" />
                </div>
                <div className="hukum-viz__field">
                  <span>{isAr ? "مدينة التسليم" : "Delivery city"}</span>
                  <Letters isAr={isAr} delay={2.0} text={isAr ? "جدة" : "Jeddah"} />
                </div>
              </div>
              <div className="hukum-viz__att">
                <Paperclip size={14} strokeWidth={1.75} />
                <span>{isAr ? "logo.png مرفق" : "logo.png attached"}</span>
              </div>
            </div>
            <div className="hukum-viz__send">
              <span className="hukum-viz__send-a">{isAr ? "إرسال الطلب" : "Send request"}</span>
              <span className="hukum-viz__send-b">
                <Check size={14} strokeWidth={2.25} />
                <span>{isAr ? "أُرسل للموردين المطابقين" : "Sent to matching suppliers"}</span>
              </span>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="hukum-viz__panel is-on hukum-viz__match" key={`match-${run}`}>
            <small>{isAr ? "مطابقة طلبك · نموذج" : "Matching your request · sample"}</small>
            <div className="hukum-viz__req">
              {(isAr ? ["أكواب ورقية", "3,000", "جدة"] : ["Paper cups", "3,000", "Jeddah"]).map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="hukum-viz__chips">
              {(isAr
                ? [["القطاع: التعبئة", "9"], ["يورد إلى جدة", "7"], ["موثّقون فقط", "5"]]
                : [["Sector: packaging", "9"], ["Delivers to Jeddah", "7"], ["Verified only", "5"]]
              ).map(([label, left], i) => (
                <span key={label} className={`is-f${i + 1}`}>
                  <Check size={12} strokeWidth={2.25} />
                  {label}
                  <em>{left}</em>
                </span>
              ))}
            </div>
            <div className="hukum-viz__grid">
              {SUPPLIERS.map((s, i) => (
                <i key={`${s.t}-${i}`} className={s.out ? `is-out is-out${s.out}` : "is-match"}>
                  {isAr ? s.t : s.e}
                </i>
              ))}
            </div>
            <div className="hukum-viz__res">
              <b>{isAr ? "5 موردين مطابقين" : "5 suppliers matched"}</b>
              <span>{isAr ? "يصل طلبك إليهم فقط" : "Your request goes only to them"}</span>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="hukum-viz__panel is-on" key={`compare-${run}`}>
            <small>{isAr ? "عروض جنباً إلى جنب · نموذج" : "Quotes side by side · sample"}</small>
            <div className="hukum-viz__quote is-best" style={{ ["--w" as string]: "84%" }}>
              <em>{isAr ? "نج" : "NS"}</em>
              <span>{isAr ? "نجد سبلايز" : "Najd Supplies"}</span>
              <b>{formatMoney(1150, locale)}</b>
              <u>{isAr ? "أفضل سعر" : "Best price"}</u>
              <s className="hukum-viz__pick"><Check size={12} strokeWidth={2.5} /></s>
            </div>
            <div className="hukum-viz__quote" style={{ ["--w" as string]: "92%" }}>
              <em>{isAr ? "وا" : "WP"}</em>
              <span>{isAr ? "الواحة للتعبئة" : "Al Waha Packaging"}</span>
              <b>{formatMoney(1240, locale)}</b>
            </div>
            <div className="hukum-viz__quote" style={{ ["--w" as string]: "100%" }}>
              <em>{isAr ? "خل" : "GT"}</em>
              <span>{isAr ? "الخليج للتجارة" : "Gulf Trading"}</span>
              <b>{formatMoney(1320, locale)}</b>
            </div>
            <div className="hukum-viz__foot">
              <MessageSquareText size={15} strokeWidth={1.75} />
              <span>
                {isAr
                  ? "اختر عرضاً ثم راسل المورد عبر حكم"
                  : "Pick one, then message the supplier through Hukum"}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
