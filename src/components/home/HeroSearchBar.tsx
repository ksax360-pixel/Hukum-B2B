"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import type { Locale } from "@/i18n/config";

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const query = q.trim();
    if (query) params.set("q", query);
    params.set("ai", "1");
    router.push(`/${locale}/products?${params.toString()}`);
  };

  return (
    <form onSubmit={submit} className="hukum-search" role="search">
      <div className="hukum-search__field">
        <Search size={18} className="hukum-search__icon" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="hukum-search__input"
          aria-label={placeholder}
          autoComplete="off"
        />
      </div>
      <button type="submit" className="hukum-search__ai">
        <Sparkles size={15} strokeWidth={2} aria-hidden />
        {aiLabel}
      </button>
    </form>
  );
}
