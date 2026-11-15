"use client";

import { useCallback, useState } from "react";
import type { Locale } from "@/i18n/config";
import { OfferResults, type ResultsView } from "./OfferResults";
import { ResultsToolbar } from "./ResultsToolbar";
import type { Offer } from "./group-offers";

type Props = {
  locale: Locale;
  base: string;
  params: Record<string, string | undefined>;
  total: number;
  products: Offer[];
  initialView?: ResultsView;
  showSort?: boolean;
};

function replaceViewInUrl(next: ResultsView) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (next === "list") url.searchParams.set("view", "list");
  else url.searchParams.delete("view");
  const qs = url.searchParams.toString();
  window.history.replaceState(window.history.state, "", qs ? `${url.pathname}?${qs}` : url.pathname);

  // Keep filter form submits in sync with the chosen view.
  const form = document.querySelector<HTMLFormElement>("form.brw-lux__form");
  if (!form) return;
  let input = form.querySelector<HTMLInputElement>('input[name="view"]');
  if (next === "list") {
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = "view";
      form.appendChild(input);
    }
    input.value = "list";
  } else if (input) {
    input.remove();
  }
}

/** Grid/list toggle without a full page refresh or scroll jump. */
export function BrowseResultsSwitch({
  locale,
  base,
  params,
  total,
  products,
  initialView = "grid",
  showSort = false,
}: Props) {
  const [view, setView] = useState<ResultsView>(initialView === "list" ? "list" : "grid");

  const onViewChange = useCallback((next: ResultsView) => {
    setView(next);
    replaceViewInUrl(next);
  }, []);

  return (
    <>
      <ResultsToolbar
        locale={locale}
        base={base}
        params={params}
        total={total}
        showSort={showSort}
        view={view}
        onViewChange={onViewChange}
      />
      <OfferResults locale={locale} products={products} view={view} />
    </>
  );
}
