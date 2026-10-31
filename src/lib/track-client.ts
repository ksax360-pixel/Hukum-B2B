"use client";

export type TrackInput = {
  type: string;
  productId?: string;
  vendorId?: string;
  meta?: Record<string, unknown>;
};

function sessionId() {
  if (typeof window === "undefined") return undefined;
  const key = "kt_session_id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = `s_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    window.localStorage.setItem(key, id);
  }
  return id;
}

export async function track(input: TrackInput) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: input.type,
        productId: input.productId,
        vendorId: input.vendorId,
        meta: {
          ...(input.meta || {}),
          sessionId: sessionId(),
          path: typeof window !== "undefined" ? window.location.pathname : undefined,
          search: typeof window !== "undefined" ? window.location.search : undefined,
          timestamp: new Date().toISOString(),
        },
      }),
      keepalive: true,
    });
  } catch {
    /* non-blocking */
  }
}

const RECENT_KEY = "kt_recently_viewed";

export function pushRecentlyViewed(product: {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  image?: string;
  locale: string;
}) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as Array<typeof product>) : [];
    const next = [product, ...list.filter((p) => p.id !== product.id)].slice(0, 8);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function readRecentlyViewed(locale: string) {
  if (typeof window === "undefined") return [] as Array<{
    id: string;
    slug: string;
    name: string;
    brand?: string;
    image?: string;
    locale: string;
  }>;
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return (Array.isArray(list) ? list : []).filter((p) => p.locale === locale);
  } catch {
    return [];
  }
}
