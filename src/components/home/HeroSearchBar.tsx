"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { useSearchSuggestions } from "@/components/search/SearchSuggestions";

const PLACEHOLDERS_EN = [
  "Paper cups, 8 oz",
  "Specialty coffee beans",
  "Industrial safety helmets",
  "Spare parts for HVAC",
  "Medical supplies, Jeddah",
  "Structural steel beams",
];

const PLACEHOLDERS_AR = [
  "أكواب ورقية 8 أونصة",
  "حبوب قهوة مختصة",
  "خوذات سلامة صناعية",
  "قطع غيار تكييف",
  "مستلزمات طبية، جدة",
  "عوارض فولاذ إنشائية",
];

export function HeroSearchBar({
  locale,
  placeholder,
  aiLabel,
}: {
  locale: Locale;
  placeholder: string;
  aiLabel: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [phIndex, setPhIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "hold" | "deleting">("typing");
  const isAr = locale === "ar";
  const phrases = isAr ? PLACEHOLDERS_AR : PLACEHOLDERS_EN;
  const prefix = isAr ? "ابحث: " : "Search: ";
  const formRef = useRef<HTMLFormElement>(null);
  const sugg = useSearchSuggestions(q, locale, (href) => router.push(href), formRef);

  useEffect(() => {
    if (q.trim()) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTyped(phrases[0] || "");
      return;
    }

    const full = phrases[phIndex] || "";
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (typed.length < full.length) {
        timer = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 42);
      } else {
        timer = setTimeout(() => setPhase("hold"), 1600);
      }
    } else if (phase === "hold") {
      timer = setTimeout(() => setPhase("deleting"), 400);
    } else {
      if (typed.length > 0) {
        timer = setTimeout(() => setTyped(typed.slice(0, -1)), 24);
      } else {
        setPhIndex((i) => (i + 1) % phrases.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timer);
  }, [phase, typed, phIndex, phrases, q]);

  useEffect(() => {
    setTyped("");
    setPhase("typing");
    setPhIndex(0);
  }, [locale]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    sugg.close();
    const params = new URLSearchParams();
    const query = q.trim();
    if (query) params.set("q", query);
    params.set("ai", "1");
    router.push(`/${locale}/products?${params.toString()}`);
  };

  // Keep "Search:" / "ابحث:" fixed; only the phrase after it types/deletes.
  const livePlaceholder = q.trim() ? placeholder : `${prefix}${typed}`;

  return (
    <form ref={formRef} onSubmit={submit} className="hukum-search disc-search" role="search">
      <div className="hukum-search__field">
        <Search size={18} className="hukum-search__icon" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            sugg.open();
          }}
          onFocus={sugg.open}
          onKeyDown={sugg.onKeyDown}
          role="combobox"
          aria-expanded={sugg.expanded}
          aria-autocomplete="list"
          aria-activedescendant={sugg.activeId}
          placeholder={livePlaceholder}
          className="hukum-search__input"
          aria-label={placeholder}
          autoComplete="off"
        />
      </div>
      <button type="submit" className="hukum-search__ai">
        <Sparkles size={15} strokeWidth={2} aria-hidden />
        {aiLabel}
      </button>
      {sugg.panel}
    </form>
  );
}
