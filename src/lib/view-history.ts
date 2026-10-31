/** Buyer browse / reorder history (client). */

export type HistoryItem = {
  id: string;
  slug: string;
  name: string;
  vendorName?: string;
  image?: string;
  at: number;
};

const KEY = "kt_view_history_v1";
const MAX = 40;

export function pushViewHistory(item: Omit<HistoryItem, "at">) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const list: HistoryItem[] = raw ? JSON.parse(raw) : [];
    const next = [
      { ...item, at: Date.now() },
      ...list.filter((x) => x.id !== item.id),
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function readViewHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}
