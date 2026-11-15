"use client";

import Link from "next/link";
import { BadgeCheck, Store } from "lucide-react";

export type MarqueeSupplier = {
  id: string;
  name: string;
  slug: string;
  cityLabel: string;
  verified: boolean;
  logo?: string;
  productCount: number;
};

type Props = {
  locale: string;
  suppliers: MarqueeSupplier[];
  productsLabel: string;
  verifiedLabel: string;
};

export function BrowseSupplierMarquee({ locale, suppliers, productsLabel, verifiedLabel }: Props) {
  if (!suppliers.length) return null;

  // Duplicate for a seamless loop; keep enough cards when the list is short.
  const loop = suppliers.length < 6 ? [...suppliers, ...suppliers, ...suppliers] : [...suppliers, ...suppliers];

  return (
    <div className="brw-band__marquee">
      <div className="brw-band__viewport">
        <div className="brw-band__track">
          {loop.map((s, i) => (
            <Link
              key={`${s.id}-${i}`}
              href={`/${locale}/vendors/${s.slug}`}
              className="brw-band__card"
              tabIndex={i >= suppliers.length ? -1 : undefined}
              aria-hidden={i >= suppliers.length || undefined}
            >
              <span className="brw-band__logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.logo ? <img src={s.logo} alt="" /> : <Store size={18} aria-hidden />}
              </span>
              <span className="brw-band__meta">
                <b>
                  {s.name}
                  {s.verified ? (
                    <BadgeCheck size={14} className="brw__tick" aria-label={verifiedLabel} />
                  ) : null}
                </b>
                <small>
                  <span>{s.cityLabel}</span>
                  <span>
                    {s.productCount} {productsLabel}
                  </span>
                </small>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
