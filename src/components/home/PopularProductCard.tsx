"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, Heart } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { AddToCompareButton } from "@/components/compare/AddToCompareButton";

export type PopularProductItem = {
  id: string;
  href: string;
  cover?: string;
  brand?: string;
  sku?: string;
  title: string;
  tags: string[];
  moqLabel: string;
  priceLabel: string;
  leadTimeLabel: string;
  verified: boolean;
  verifiedLabel: string;
  vendorName?: string;
  slug: string;
  rfqHref: string;
};

function HeartSave({ productId, locale }: { productId: string; locale: Locale }) {
  const isAr = locale === "ar";
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kt_saved_products");
      const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      setSaved(Boolean(map[productId]));
    } catch {
      /* ignore */
    }
  }, [productId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    try {
      const raw = localStorage.getItem("kt_saved_products");
      const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      if (next) map[productId] = true;
      else delete map[productId];
      localStorage.setItem("kt_saved_products", JSON.stringify(map));
      window.dispatchEvent(new Event("storage"));
    } catch {
      /* ignore */
    }
    void fetch("/api/platform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_product", productId }),
    }).catch(() => {});
  };

  return (
    <button
      type="button"
      className="hukum-pop-card__heart"
      onClick={toggle}
      aria-label={saved ? (isAr ? "محفوظ" : "Saved") : isAr ? "حفظ" : "Save"}
      aria-pressed={saved}
    >
      <Heart
        size={16}
        strokeWidth={1.75}
        className={saved ? "fill-[#17634B] text-[#17634B]" : "text-[#6B7870]"}
      />
    </button>
  );
}

export function PopularProductCard({
  locale,
  item,
}: {
  locale: Locale;
  item: PopularProductItem;
}) {
  const isAr = locale === "ar";
  const meta = [item.brand, item.sku].filter(Boolean).join(" · ");

  return (
    <article className="hukum-pop-card">
      <div className="hukum-pop-card__media">
        {item.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover} alt="" className="hukum-pop-card__img" loading="lazy" />
        ) : (
          <span className="hukum-pop-card__placeholder">{item.title.slice(0, 1)}</span>
        )}
        <HeartSave productId={item.id} locale={locale} />
      </div>

      <div className="hukum-pop-card__body">
        {meta ? <p className="hukum-pop-card__meta">{meta}</p> : null}
        <Link href={item.href} className="hukum-pop-card__title">
          {item.title}
        </Link>

        {item.tags.length > 0 ? (
          <div className="hukum-pop-card__tags">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="hukum-pop-card__tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <dl className="hukum-pop-card__specs">
          <div>
            <dt>{isAr ? "الحد الأدنى" : "MOQ"}</dt>
            <dd>{item.moqLabel}</dd>
          </div>
          <div>
            <dt>{isAr ? "السعر" : "Price"}</dt>
            <dd>{item.priceLabel}</dd>
          </div>
          <div>
            <dt>{isAr ? "مدة التوريد" : "Lead time"}</dt>
            <dd>{item.leadTimeLabel}</dd>
          </div>
        </dl>

        {item.verified ? (
          <p className="hukum-pop-card__verified">
            <BadgeCheck size={13} strokeWidth={2} />
            {item.verifiedLabel}
          </p>
        ) : null}

        <Link href={item.rfqHref} className="hukum-pop-card__quote">
          {isAr ? "اطلب عرض سعر" : "Request quote"}
        </Link>

        <div className="hukum-pop-card__footer">
          <Link href={item.href} className="hukum-pop-card__details">
            {isAr ? "عرض التفاصيل" : "View details"}
          </Link>
          <AddToCompareButton
            locale={locale}
            className="hukum-pop-card__compare"
            item={{
              id: item.id,
              slug: item.slug,
              name: item.title,
              image: item.cover,
              vendorName: item.vendorName,
              priceLabel: item.priceLabel,
              moq: item.moqLabel,
              leadTime: item.leadTimeLabel,
              verified: item.verified,
            }}
          />
        </div>
      </div>
    </article>
  );
}
