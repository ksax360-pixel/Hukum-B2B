"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, X } from "lucide-react";
import { DEMO_ACCOUNTS } from "@/data/demo-accounts";

export const DEMO_LOGIN_EVENT = "kt-demo-login";

export function fillDemoLogin(email: string, password: string) {
  window.dispatchEvent(new CustomEvent(DEMO_LOGIN_EVENT, { detail: { email, password } }));
}

export function DemoAccessChip({ locale = "en" }: { locale?: string }) {
  const isAr = locale === "ar";
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const [selected, setSelected] = useState<string>(DEMO_ACCOUNTS[0].email);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const copy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      /* ignore */
    }
  };

  const apply = (email: string, password: string) => {
    fillDemoLogin(email, password);
    setSelected(email);
  };

  const selectedAcc = DEMO_ACCOUNTS.find((a) => a.email === selected) || DEMO_ACCOUNTS[0];
  const fullText = `${isAr ? "البريد" : "Email"}: ${selectedAcc.email}\n${isAr ? "كلمة المرور" : "Password"}: ${selectedAcc.password}`;

  return (
    <>
      <button
        type="button"
        className="auth-temp-chip"
        onClick={() => {
          setOpen(true);
          apply(selected, selectedAcc.password);
        }}
      >
        <KeyRound size={14} strokeWidth={2} />
        <span>{isAr ? "مؤقت" : "Temporary"}</span>
      </button>

      {open ? (
        <div className="auth-temp-modal" role="dialog" aria-modal="true" aria-labelledby="auth-temp-title">
          <button type="button" className="auth-temp-modal__backdrop" aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setOpen(false)} />
          <div className="auth-temp-modal__panel">
            <div className="auth-temp-modal__head">
              <div>
                <p className="auth-temp-modal__kicker">{isAr ? "وصول تجريبي" : "Demo access"}</p>
                <h2 id="auth-temp-title" className="auth-temp-modal__title">
                  {isAr ? "حسابات مؤقتة" : "Temporary login details"}
                </h2>
              </div>
              <button type="button" className="auth-temp-modal__close" onClick={() => setOpen(false)} aria-label={isAr ? "إغلاق" : "Close"}>
                <X size={16} />
              </button>
            </div>
            <p className="auth-temp-modal__hint">
              {isAr
                ? "اختر حساباً لعرض بياناته بالكامل وتعبئة نموذج تسجيل الدخول."
                : "Pick an account to show the full details and fill the sign-in form."}
            </p>
            <ul className="auth-temp-modal__list">
              {DEMO_ACCOUNTS.map((acc) => {
                const role = isAr ? acc.roleAr : acc.role;
                const active = selected === acc.email;
                return (
                  <li key={acc.email}>
                    <button
                      type="button"
                      className={`auth-temp-card${active ? " is-active" : ""}`}
                      onClick={() => apply(acc.email, acc.password)}
                    >
                      <p className="auth-temp-card__role">{role}</p>
                      {active ? (
                        <div className="auth-temp-card__details">
                          <p>
                            <em>{isAr ? "البريد" : "Email"}</em>
                            <strong>{acc.email}</strong>
                          </p>
                          <p>
                            <em>{isAr ? "كلمة المرور" : "Password"}</em>
                            <strong>{acc.password}</strong>
                          </p>
                        </div>
                      ) : (
                        <p className="auth-temp-card__preview">{acc.name}</p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="auth-temp-modal__actions">
              <button
                type="button"
                className="auth-temp-card__all"
                onClick={() => copy(fullText, "all")}
              >
                {copied === "all" ? <Check size={14} /> : <Copy size={14} />}
                {copied === "all"
                  ? isAr
                    ? "تم نسخ التفاصيل"
                    : "Details copied"
                  : isAr
                    ? "نسخ التفاصيل كاملة"
                    : "Copy full details"}
              </button>
              <button
                type="button"
                className="auth-temp-use"
                onClick={() => {
                  apply(selectedAcc.email, selectedAcc.password);
                  setOpen(false);
                }}
              >
                {isAr ? "تعبئة تسجيل الدخول" : "Fill sign in"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
