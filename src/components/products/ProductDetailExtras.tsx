"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/track-client";

export function ProductShareSave({
  locale,
  productId,
  vendorId,
  title,
  url,
}: {
  locale: "en" | "ar";
  productId: string;
  vendorId?: string;
  title: string;
  url: string;
}) {
  const isAr = locale === "ar";
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kt_saved_products");
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      setSaved(list.includes(productId));
    } catch {
      /* ignore */
    }
  }, [productId]);

  function absoluteUrl() {
    if (typeof window === "undefined") return url;
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  }

  function toggleSave() {
    try {
      const raw = localStorage.getItem("kt_saved_products");
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      const next = list.includes(productId)
        ? list.filter((id) => id !== productId)
        : [...list, productId];
      localStorage.setItem("kt_saved_products", JSON.stringify(next));
      setSaved(next.includes(productId));
      void track({
        type: "product_saved",
        productId,
        vendorId,
        meta: { saved: next.includes(productId) },
      });
    } catch {
      /* ignore */
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl());
      setCopied(true);
      void track({ type: "product_shared", productId, vendorId, meta: { channel: "copy" } });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  const shareUrl = absoluteUrl();
  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl}`)}`;
  const mail = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="kt-pdp-share">
      <button type="button" className={`kt-pdp-share__btn${saved ? " is-on" : ""}`} onClick={toggleSave}>
        {saved ? (isAr ? "محفوظ" : "Saved") : isAr ? "حفظ" : "Save"}
      </button>
      <button type="button" className="kt-pdp-share__btn" onClick={copyLink}>
        {copied ? (isAr ? "تم النسخ" : "Copied") : isAr ? "نسخ الرابط" : "Copy link"}
      </button>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="kt-pdp-share__btn"
        onClick={() => void track({ type: "product_shared", productId, vendorId, meta: { channel: "whatsapp" } })}
      >
        WhatsApp
      </a>
      <a
        href={mail}
        className="kt-pdp-share__btn"
        onClick={() => void track({ type: "product_shared", productId, vendorId, meta: { channel: "email" } })}
      >
        {isAr ? "بريد" : "Email"}
      </a>
      <a
        href={li}
        target="_blank"
        rel="noopener noreferrer"
        className="kt-pdp-share__btn"
        onClick={() => void track({ type: "product_shared", productId, vendorId, meta: { channel: "linkedin" } })}
      >
        LinkedIn
      </a>
    </div>
  );
}

export function ProductFaq({
  items,
  productId,
  vendorId,
}: {
  items: { q: string; a: string }[];
  productId: string;
  vendorId?: string;
}) {
  if (!items.length) return null;
  return (
    <div className="kt-pdp-faq">
      {items.map((item) => (
        <details
          key={item.q}
          className="kt-pdp-faq__item"
          onToggle={(e) => {
            if ((e.target as HTMLDetailsElement).open) {
              void track({
                type: "product_faq_open",
                productId,
                vendorId,
                meta: { question: item.q },
              });
            }
          }}
        >
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
