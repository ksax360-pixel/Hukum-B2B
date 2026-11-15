import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export type HukumSectorCardProps = {
  href: string;
  nameEn: string;
  nameAr: string;
  imageSrc: string;
  locale?: "en" | "ar";
};

/**
 * Exact visual twin of the homepage Browse-by-sector tile (.hukum-sector-card).
 */
export function HukumSectorCard({
  href,
  nameEn,
  nameAr,
  imageSrc,
  locale = "en",
}: HukumSectorCardProps) {
  const title = locale === "ar" ? nameAr || nameEn : nameEn || nameAr;
  const pngSrc = imageSrc.endsWith(".webp") ? imageSrc.replace(/\.webp$/i, ".png") : imageSrc;
  const webpSrc = imageSrc.endsWith(".webp")
    ? imageSrc
    : imageSrc.includes("/images/categories/")
      ? imageSrc.replace(/\.(png|jpg|jpeg)$/i, ".webp")
      : null;

  return (
    <Link href={href} className="hukum-sector-card group" aria-label={title}>
      <span className="hukum-sector-card__media">
        <picture>
          {webpSrc ? <source type="image/webp" srcSet={webpSrc} /> : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pngSrc}
            alt=""
            className="hukum-sector-card__img"
            loading="lazy"
          />
        </picture>
      </span>
      <span className="hukum-sector-card__foot">
        <span className="hukum-sector-card__name">{title}</span>
        <span className="hukum-sector-card__arrow" aria-hidden>
          <ArrowUpRight size={14} strokeWidth={1.75} />
        </span>
      </span>
    </Link>
  );
}
