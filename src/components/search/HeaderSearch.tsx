"use client";

// Header search on every page except home (home has the hero box). Same suggestion panel as the hero (D2, D4).

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Search } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { useSearchSuggestions } from "@/components/search/SearchSuggestions";

export function HeaderSearch({ locale, variant = "desktop" }: { locale: Locale; variant?: "desktop" | "mobile" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const isAr = locale === "ar";
  const sugg = useSearchSuggestions(q, locale, (href) => router.push(href), formRef);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    sugg.close();
    const query = q.trim();
    router.push(query ? `/${locale}/products?q=${encodeURIComponent(query)}` : `/${locale}/products`);
  };

  return (
    <form ref={formRef} onSubmit={submit} role="search" className={`hsearch hsearch--${variant}`} dir={isAr ? "rtl" : "ltr"}>
      <Search size={16} aria-hidden className="hsearch__icon" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          sugg.open();
        }}
        onFocus={sugg.open}
        onKeyDown={sugg.onKeyDown}
        placeholder={isAr ? "ابحث عن منتج أو مورد…" : "Search products or suppliers"}
        aria-label={isAr ? "ابحث في حكم" : "Search Hukum"}
        role="combobox"
        aria-expanded={sugg.expanded}
        aria-autocomplete="list"
        aria-activedescendant={sugg.activeId}
        autoComplete="off"
        enterKeyHint="search"
      />
      {sugg.panel}
    </form>
  );
}
