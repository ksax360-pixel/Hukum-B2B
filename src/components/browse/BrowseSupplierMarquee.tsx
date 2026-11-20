"use client";

import { useState } from "react";
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

function SupplierLogo({ src, name }: { src?: string; name: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className="brw-band__logo brw-band__logo--fallback" aria-hidden>
        <Store size={18} />
      </span>
    );
  }
  return (
    <span className="brw-band__logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onError={() => setBroken(true)}
      />
    </span>
  );
}

export function BrowseSupplierMarquee({ locale, suppliers, productsLabel, verifiedLabel }: Props) {
  if (!suppliers.length) return null;

  // Duplicate for a seamless loop; keep enough cards when the list is short.
  const loop = suppliers.length < 6 ? [...suppliers, ...suppliers, ...suppliers] : [...suppliers, ...suppliers];

  return (
    <div className="brw-band__marquee">
      <div className="brw-band__viewport">
        <div className="brw-band__track">
          {loop.map((s, i) => {
            const countLabel =
              s.productCount === 1
                ? locale === "ar"
                  ? "منتج واحد"
                  : "1 product"
                : `${s.productCount} ${productsLabel}`;
            return (
              <Link
                key={`${s.id}-${i}`}
                href={`/${locale}/vendors/${s.slug}`}
                className="brw-band__card"
                tabIndex={i >= suppliers.length ? -1 : undefined}
                aria-hidden={i >= suppliers.length || undefined}
              >
                <SupplierLogo src={s.logo} name={s.name} />
                <span className="brw-band__meta">
                  <b>
                    {s.name}
                    {s.verified ? (
                      <BadgeCheck size={14} className="brw__tick" aria-label={verifiedLabel} />
                    ) : null}
                  </b>
                  <small>
                    <span>{s.cityLabel}</span>
                    <span>{countLabel}</span>
                  </small>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
