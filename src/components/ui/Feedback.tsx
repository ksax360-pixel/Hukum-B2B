"use client";

// One styled confirm dialog and one toast for the whole site, replacing window.confirm / prompt / alert
// (unstyled, no RTL, and the cause of "nothing happened" reports in the staging test).
// Usage: const { ok, reason } = await ask({ title, body, confirmLabel, reasons }); toast("Saved");

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

type Tone = "default" | "danger";
export type AskOptions = {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: Tone;
  /** Show a reason box. Presets become one-tap chips. */
  reason?: { label: string; placeholder?: string; required?: boolean; presets?: string[] };
};
type AskResult = { ok: boolean; reason: string };
type ToastTone = "success" | "error" | "info";

const ASK_EVENT = "hukum:ask";
const TOAST_EVENT = "hukum:toast";

export function ask(opts: AskOptions): Promise<AskResult> {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: { opts, resolve } }));
  });
}

export function toast(message: string, tone: ToastTone = "success"): void {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, tone } }));
}

const isRtl = (): boolean => typeof document !== "undefined" && document.querySelector("[dir=rtl]") !== null && document.documentElement.lang === "ar";

export function FeedbackHost({ locale }: { locale: string }) {
  const [req, setReq] = useState<{ opts: AskOptions; resolve: (r: AskResult) => void } | null>(null);
  const [reason, setReason] = useState("");
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; tone: ToastTone }>>([]);
  const confirmRef = useRef<HTMLButtonElement>(null);
  // Portal only after mount: rendering it during SSR/hydration caused a mismatch with the server HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dir = locale === "ar" || isRtl() ? "rtl" : "ltr";

  useEffect(() => {
    const onAsk = (e: Event) => {
      const d = (e as CustomEvent).detail as { opts: AskOptions; resolve: (r: AskResult) => void };
      setReason("");
      setReq(d);
    };
    const onToast = (e: Event) => {
      const d = (e as CustomEvent).detail as { message: string; tone: ToastTone };
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-2), { id, ...d }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
    };
    window.addEventListener(ASK_EVENT, onAsk);
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(ASK_EVENT, onAsk);
      window.removeEventListener(TOAST_EVENT, onToast);
    };
  }, []);

  useEffect(() => {
    if (!req) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req]);

  const close = (ok: boolean) => {
    if (!req) return;
    req.resolve({ ok, reason: reason.trim() });
    setReq(null);
  };

  if (!mounted) return null;
  const needReason = Boolean(req?.opts.reason?.required) && !reason.trim();
  const ar = locale === "ar";

  return createPortal(
    <>
      {req ? (
        <div className="fb-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div className="fb-dialog" role="alertdialog" aria-modal="true" aria-labelledby="fb-title" dir={dir}>
            <div className={`fb-dialog__icon${req.opts.tone === "danger" ? " is-danger" : ""}`} aria-hidden>
              {req.opts.tone === "danger" ? <AlertTriangle size={20} /> : <Info size={20} />}
            </div>
            <h2 id="fb-title">{req.opts.title}</h2>
            {req.opts.body ? <p>{req.opts.body}</p> : null}
            {req.opts.reason ? (
              <div className="fb-reason">
                <label htmlFor="fb-reason">{req.opts.reason.label}</label>
                {req.opts.reason.presets?.length ? (
                  <div className="fb-presets">
                    {req.opts.reason.presets.map((p) => (
                      <button key={p} type="button" className={reason === p ? "is-on" : ""} onClick={() => setReason(p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                ) : null}
                <textarea id="fb-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={req.opts.reason.placeholder} />
              </div>
            ) : null}
            <div className="fb-actions">
              <button type="button" className="fb-btn" onClick={() => close(false)}>
                {req.opts.cancelLabel || (ar ? "إلغاء" : "Cancel")}
              </button>
              <button
                ref={confirmRef}
                type="button"
                className={`fb-btn fb-btn--primary${req.opts.tone === "danger" ? " is-danger" : ""}`}
                disabled={needReason}
                onClick={() => close(true)}
              >
                {req.opts.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="fb-toasts" role="status" aria-live="polite" dir={dir}>
        {toasts.map((t) => (
          <div key={t.id} className={`fb-toast is-${t.tone}`}>
            {t.tone === "success" ? <CheckCircle2 size={16} aria-hidden /> : t.tone === "error" ? <AlertTriangle size={16} aria-hidden /> : <Info size={16} aria-hidden />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>,
    document.body
  );
}
