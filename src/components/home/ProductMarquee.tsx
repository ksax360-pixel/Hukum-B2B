"use client";

import Link from "next/link";

export type FeaturedProductCard = {
  id: string;
  href: string;
  cover?: string;
  verified: boolean;
  verifiedLabel: string;
  featured?: boolean;
  featuredLabel?: string;
  brand: string;
  title: string;
  meta: string;
};

const TONES = ["#EEF3F7", "#F4F0E8", "#EEF2EE"];

export function ProductMarquee({
  items,
  emptyLabel,
}: {
  items: FeaturedProductCard[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <div className="empty-state !py-8">{emptyLabel}</div>;
  }

  const copies = items.length >= 8 ? 2 : items.length >= 4 ? 4 : 6;
  const row = Array.from({ length: copies }, () => items).flat();

  return (
    <div className="home-product-marquee" aria-label={emptyLabel}>
      <div className="home-product-marquee__track">
        {row.map((p, i) => (
          <Link
            key={`${p.id}-${i}`}
            href={p.href}
            className="home-product home-product--marquee group"
            tabIndex={i >= items.length ? -1 : 0}
            aria-hidden={i >= items.length}
          >
            <div
              className="home-product__media"
              style={{ background: TONES[i % TONES.length] }}
            >
              {p.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover} alt="" className="home-product__img" />
              ) : null}
              <div className="home-product__sheen" aria-hidden />
              <div className="home-product__badges">
                {p.featured ? (
                  <span className="home-product__badge home-product__badge--featured">
                    {p.featuredLabel || "Featured"}
                  </span>
                ) : null}
                {p.verified ? <span className="home-product__badge">{p.verifiedLabel}</span> : null}
              </div>
            </div>
            <div className="home-product__body">
              <p className="home-product__brand">{p.brand}</p>
              <h3 className="home-product__title">{p.title}</h3>
              <p className="home-product__meta">{p.meta}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
