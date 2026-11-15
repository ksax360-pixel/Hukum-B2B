/** Client-side product compare tray (max 5 — Hukum compare & recommend). */

export type CompareItem = {
  id: string;
  slug: string;
  name: string;
  image?: string;
  vendorName?: string;
  priceLabel?: string;
  moq?: string | number;
  leadTime?: string;
  city?: string;
  unit?: string;
  verified?: boolean;
};

const KEY = "kt_compare_v1";
const MAX = 5;
export const COMPARE_EVENT = "kt-compare-change";

export function readCompare(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as CompareItem[];
    return Array.isArray(list) ? list.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(items: CompareItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  window.dispatchEvent(new CustomEvent(COMPARE_EVENT, { detail: items }));
}

export function addToCompare(item: CompareItem): { ok: boolean; reason?: string; items: CompareItem[] } {
  const cur = readCompare();
  if (cur.some((x) => x.id === item.id)) return { ok: true, items: cur };
  if (cur.length >= MAX) return { ok: false, reason: "max", items: cur };
  const next = [...cur, item];
  write(next);
  return { ok: true, items: next };
}

export function removeFromCompare(id: string) {
  const next = readCompare().filter((x) => x.id !== id);
  write(next);
  return next;
}

export function clearCompare() {
  write([]);
}

export function isInCompare(id: string) {
  return readCompare().some((x) => x.id === id);
}
