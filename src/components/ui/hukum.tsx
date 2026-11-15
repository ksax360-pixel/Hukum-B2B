import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function HukumBtn({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "gold" | "ghost";
  size?: "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "hukum-btn",
        variant === "primary" && "hukum-btn--primary",
        variant === "secondary" && "hukum-btn--secondary",
        variant === "gold" && "hukum-btn--gold",
        variant === "ghost" && "hukum-btn--ghost",
        size === "lg" && "hukum-btn--lg",
        className
      )}
      {...props}
    />
  );
}

export function HukumCard({
  soft = false,
  className,
  children,
}: {
  soft?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("hukum-card", soft && "hukum-card--soft", className)}>{children}</div>;
}

export function HukumChip({
  active = false,
  className,
  children,
}: {
  active?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("hukum-chip", active && "hukum-chip--active", className)}>{children}</span>
  );
}

export function HukumBadge({
  gold = false,
  className,
  children,
}: {
  gold?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("hukum-badge-pill", gold && "hukum-badge-pill--gold", className)}>
      {children}
    </span>
  );
}

export function HukumField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="hukum-field">
      <label className="hukum-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-[var(--hukum-muted)]">{hint}</p> : null}
    </div>
  );
}

export function HukumInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("hukum-input", props.className)} {...props} />;
}

export function HukumSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("hukum-select", props.className)} {...props} />;
}

export function HukumTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("hukum-textarea", props.className)} {...props} />;
}

export function HukumEmpty({
  title,
  text,
  actions,
}: {
  title: string;
  text?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="hukum-empty">
      <h2 className="hukum-empty__title">{title}</h2>
      {text ? <p className="hukum-empty__text">{text}</p> : null}
      {actions}
    </div>
  );
}

export function HukumSkeleton({ className }: { className?: string }) {
  return <div className={cn("hukum-skeleton", className)} aria-hidden />;
}
