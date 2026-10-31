"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Play, X, ZoomIn } from "lucide-react";
import { track } from "@/lib/track-client";
import { toneForId } from "./product-helpers";

type MediaItem = {
  url?: string;
  type?: string;
  alt?: string;
};

export function ProductGallery({
  productId,
  vendorId,
  title,
  media,
}: {
  productId: string;
  vendorId?: string;
  title: string;
  media: MediaItem[];
}) {
  const items =
    media.length > 0
      ? media
      : [
          { url: undefined, type: "image", alt: `${title} — view 1` },
          { url: undefined, type: "image", alt: `${title} — view 2` },
          { url: undefined, type: "image", alt: `${title} — view 3` },
          { url: undefined, type: "image", alt: `${title} — packaging` },
        ];

  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const current = items[index] || items[0];
  const isVideo = current?.type === "video";
  const is3d = current?.type === "360";

  useEffect(() => {
    void track({
      type: "product_image_view",
      productId,
      vendorId,
      meta: { index, mediaType: current?.type || "placeholder" },
    });
  }, [index, productId, vendorId, current?.type]);

  useEffect(() => {
    const el = thumbsRef.current?.querySelector<HTMLElement>(`[data-thumb="${index}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  const scrollThumbs = (dir: -1 | 1) => {
    thumbsRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });
  };

  return (
    <div className="kt-gallery">
      <div
        className="kt-gallery__main"
        onTouchStart={(e) => {
          touchX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) < 40) return;
          if (dx > 0) prev();
          else next();
        }}
      >
        {current?.url ? (
          isVideo ? (
            <video
              key={current.url}
              className="kt-gallery__media"
              controls
              poster={items.find((m) => m.type === "image")?.url}
              onPlay={() =>
                void track({ type: "product_video_play", productId, vendorId, meta: { url: current.url } })
              }
            >
              <source src={current.url} />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt={current.alt || title} className="kt-gallery__media" />
          )
        ) : (
          <div
            className="kt-gallery__placeholder"
            style={{ background: toneForId(`${productId}-${index}`) }}
          >
            <span>{title.slice(0, 1).toUpperCase()}</span>
            <em>{current?.alt || title}</em>
          </div>
        )}

        <div className="kt-gallery__tools">
          {is3d ? <span className="kt-gallery__chip">3D View</span> : null}
          <span className="kt-gallery__chip">
            {index + 1} / {items.length}
          </span>
          {current?.url ? (
            <button
              type="button"
              className="kt-gallery__icon-btn"
              onClick={() => {
                setLightbox(true);
                void track({ type: "product_gallery_open", productId, vendorId });
              }}
              aria-label="Open gallery"
            >
              <Maximize2 size={16} />
            </button>
          ) : null}
          {current?.url && !isVideo ? (
            <button type="button" className="kt-gallery__icon-btn" onClick={() => setLightbox(true)} aria-label="Zoom">
              <ZoomIn size={16} />
            </button>
          ) : null}
        </div>

        {items.length > 1 ? (
          <>
            <button type="button" className="kt-gallery__nav kt-gallery__nav--prev" onClick={prev} aria-label="Previous">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="kt-gallery__nav kt-gallery__nav--next" onClick={next} aria-label="Next">
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="kt-gallery__scroller">
          <button
            type="button"
            className="kt-gallery__scroll-btn"
            onClick={() => scrollThumbs(-1)}
            aria-label="Scroll thumbnails left"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="kt-gallery__thumbs" ref={thumbsRef}>
            {items.map((item, i) => (
              <button
                key={`${item.url}-${i}`}
                type="button"
                data-thumb={i}
                className={`kt-gallery__thumb ${i === index ? "is-active" : ""}`}
                onClick={() => setIndex(i)}
              >
                {item.type === "video" ? (
                  <span className="kt-gallery__thumb-video">
                    <Play size={14} />
                  </span>
                ) : item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" />
                ) : (
                  <span className="kt-gallery__thumb-empty" style={{ background: toneForId(`${productId}-${i}`) }}>
                    {i + 1}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="kt-gallery__scroll-btn"
            onClick={() => scrollThumbs(1)}
            aria-label="Scroll thumbnails right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : null}

      {lightbox && current?.url ? (
        <div className="kt-lightbox" role="dialog" aria-modal="true">
          <button type="button" className="kt-lightbox__backdrop" aria-label="Close" onClick={() => setLightbox(false)} />
          <div className="kt-lightbox__panel">
            <button type="button" className="kt-lightbox__close" onClick={() => setLightbox(false)} aria-label="Close">
              <X size={18} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt={current.alt || title} className="kt-lightbox__img" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
