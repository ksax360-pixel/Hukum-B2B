import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type LocalizedString = {
  en?: string;
  ar?: string;
};

export function t(locale: string, value?: LocalizedString | string | null): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const loc = locale.startsWith("ar") ? "ar" : "en";
  return value[loc] || value.en || value.ar || "";
}

export function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
