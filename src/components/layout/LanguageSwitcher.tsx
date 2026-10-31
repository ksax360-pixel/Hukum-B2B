"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const OPTIONS: { id: Locale; short: string; label: string }[] = [
  { id: "en", short: "EN", label: "English" },
  { id: "ar", short: "عربي", label: "العربية" },
];

export function LanguageSwitcher({
  locale,
  variant = "header",
}: {
  locale: Locale;
  variant?: "header" | "drawer" | "soft";
}) {
  const pathname = usePathname();
  const router = useRouter();

  const setLocale = (next: Locale) => {
    if (next === locale) return;
    const rest = pathname.replace(/^\/(en|ar)/, "") || "";
    router.push(`/${next}${rest}`);
  };

  if (variant === "soft") {
    return (
      <div
        dir="ltr"
        role="group"
        aria-label={locale === "ar" ? "اللغة" : "Language"}
        className="hukum-lang"
      >
        {OPTIONS.map((opt) => {
          const active = locale === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={cn("hukum-lang__btn", active && "is-active")}
              aria-pressed={active}
              aria-label={opt.label}
              onClick={() => setLocale(opt.id)}
            >
              {opt.id === "ar" ? "ع" : opt.short}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      role="group"
      aria-label={locale === "ar" ? "اللغة" : "Language"}
      className={cn("kt-lang", variant === "drawer" && "kt-lang--drawer", locale === "ar" && "is-ar")}
    >
      <span className="kt-lang__thumb" aria-hidden />
      {OPTIONS.map((opt) => {
        const active = locale === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            className={cn("kt-lang__btn", active && "is-active")}
            aria-pressed={active}
            aria-label={opt.label}
            onClick={() => setLocale(opt.id)}
          >
            <span className="kt-lang__short">{opt.short}</span>
            <span className="kt-lang__full">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
