"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readRecentlyViewed } from "@/lib/track-client";

export function RecentlyViewed({ locale, excludeId }: { locale: string; excludeId?: string }) {
  const [items, setItems] = useState<Array<{ id: string; slug: string; name: string; brand?: string; image?: string }>>([]);

  useEffect(() => {
    setItems(readRecentlyViewed(locale).filter((p) => p.id !== excludeId));
  }, [locale, excludeId]);

  if (!items.length) return null;

  const isAr = locale === "ar";

  return (
    <section className="kt-pdp-section">
      <h2 className="kt-pdp-h2">{isAr ? "شوهد مؤخراً" : "Recently viewed"}</h2>
      <div className="kt-related-row">
        {items.map((item) => (
          <Link key={item.id} href={`/${locale}/products/${item.slug}`} className="kt-related-mini">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" className="kt-related-mini__img" />
            ) : (
              <span className="kt-related-mini__mark">{item.name.slice(0, 1).toUpperCase()}</span>
            )}
            <span className="min-w-0">
              <strong>{item.name}</strong>
              {item.brand ? <em>{item.brand}</em> : null}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
