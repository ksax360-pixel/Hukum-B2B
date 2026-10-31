"use client";

import { useId, useState, type ChangeEventHandler, type ReactNode } from "react";
import { useParams } from "next/navigation";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 4l16 16" strokeLinecap="round" />
      <path d="M10.6 10.7a2.4 2.4 0 0 0 3.3 0.3" strokeLinecap="round" />
      <path d="M7.1 7.4C5 8.8 3.5 11 3 12c0 0 3.5 7 9 7 1.8 0 3.4-.6 4.8-1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.8 16.3C18.9 14.9 20.4 12.8 21 12c0 0-3.5-7-9-7-1.1 0-2.1.2-3.1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AuthLuxStack({ children }: { children: ReactNode }) {
  return <div className="auth-lux-stack">{children}</div>;
}

export function AuthLuxField({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  disabled,
  revealable = false,
  minLength,
  maxLength,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  revealable?: boolean;
  minLength?: number;
  maxLength?: number;
}) {
  const id = useId();
  const params = useParams();
  const [revealed, setRevealed] = useState(false);
  const inputType = revealable ? (revealed ? "text" : "password") : type;
  const isAr = String(params.locale || "") === "ar";

  return (
    <div className={`auth-lux-field${revealable ? " auth-lux-field--reveal" : ""}${value ? " is-filled" : ""}`}>
      <label className="auth-lux-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={inputType}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder=" "
        required={required}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
        className="auth-lux-input"
      />
      {revealable ? (
        <button
          type="button"
          className="auth-lux-reveal"
          aria-label={revealed ? (isAr ? "إخفاء كلمة المرور" : "Hide password") : isAr ? "إظهار كلمة المرور" : "Show password"}
          onClick={(e) => {
            e.preventDefault();
            setRevealed((v) => !v);
          }}
        >
          <EyeIcon open={revealed} />
        </button>
      ) : null}
    </div>
  );
}
