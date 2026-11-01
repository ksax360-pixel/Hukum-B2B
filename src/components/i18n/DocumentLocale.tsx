"use client";

import { useLayoutEffect } from "react";

export function DocumentLocale({ locale, dir }: { locale: string; dir: "rtl" | "ltr" }) {
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.lang = locale === "ar" ? "ar" : "en";
    html.dir = dir;
    html.classList.toggle("arabic-font", locale === "ar");
  }, [locale, dir]);
  return null;
}
