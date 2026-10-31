import Link from "next/link";
import { ArrowRight, Cable, HeartPulse, Truck } from "lucide-react";
import type { ReactNode } from "react";

export type ShowcaseProduct = {
  kind: "product";
  id: string;
  href: string;
  title: string;
  cover?: string;
  label: string;
};

export type ShowcasePromo = {
  kind: "promo";
  id: string;
  href: string;
  title: string;
  cta: string;
};

export type ShowcaseSector = {
  kind: "sector";
  id: string;
  href: string;
  title: string;
  subtitle: string;
  icon: "medical" | "electrical" | "logistics" | "default";
};

export type ShowcaseCardItem = ShowcaseProduct | ShowcasePromo | ShowcaseSector;

const TONES = ["#F3F5F4", "#F6F4F0", "#F1F4F6", "#F5F2EE"];

function SectorIcon({ icon }: { icon: ShowcaseSector["icon"] }) {
  const props = { size: 28, strokeWidth: 1.5, className: "text-[#17634B]" } as const;
  if (icon === "medical") return <HeartPulse {...props} />;
  if (icon === "electrical") return <Cable {...props} />;
  if (icon === "logistics") return <Truck {...props} />;
  return <Cable {...props} />;
}

export function ShowcaseProductCard({
  item,
  toneIndex = 0,
}: {
  item: ShowcaseProduct;
  toneIndex?: number;
}) {
  return (
    <Link href={item.href} className="hukum-card hukum-card--product group">
      <span className="hukum-card__shine" aria-hidden />
      <div
        className="hukum-card__media"
        style={{ background: TONES[toneIndex % TONES.length] }}
      >
        {item.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover} alt="" className="hukum-card__img" loading="lazy" />
        ) : (
          <span className="hukum-card__placeholder" aria-hidden>
            {item.title.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="hukum-card__body">
        <h3 className="hukum-card__title">{item.title}</h3>
        <p className="hukum-card__meta">{item.label}</p>
        <span className="hukum-card__rfq">
          Request quote
          <ArrowRight size={12} strokeWidth={2.25} className="rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}

export function ShowcasePromoCard({ item }: { item: ShowcasePromo }) {
  return (
    <Link href={item.href} className="hukum-card hukum-card--promo group">
      <span className="hukum-card__shine hukum-card__shine--promo" aria-hidden />
      <span className="hukum-card__promo-glow" aria-hidden />
      <p className="hukum-card__promo-title">
        {item.title.split("\n").map((line, i) => (
          <span key={i}>
            {i > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </p>
      <span className="hukum-card__promo-cta">
        {item.cta}
        <ArrowRight size={14} strokeWidth={2} className="rtl:rotate-180" />
      </span>
    </Link>
  );
}

export function ShowcaseSectorCard({ item }: { item: ShowcaseSector }) {
  return (
    <Link href={item.href} className="hukum-card hukum-card--sector group">
      <span className="hukum-card__shine" aria-hidden />
      <span className="hukum-card__sector-icon" aria-hidden>
        <SectorIcon icon={item.icon} />
      </span>
      <div>
        <h3 className="hukum-card__title">{item.title}</h3>
        <p className="hukum-card__meta">{item.subtitle}</p>
      </div>
    </Link>
  );
}

export function renderShowcaseCard(item: ShowcaseCardItem, index: number): ReactNode {
  if (item.kind === "product") {
    return <ShowcaseProductCard key={`${item.id}-${index}`} item={item} toneIndex={index} />;
  }
  if (item.kind === "promo") {
    return <ShowcasePromoCard key={`${item.id}-${index}`} item={item} />;
  }
  return <ShowcaseSectorCard key={`${item.id}-${index}`} item={item} />;
}
