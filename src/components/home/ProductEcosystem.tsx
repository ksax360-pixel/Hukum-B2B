"use client";

import { useEffect, useMemo, useState } from "react";

export type EcoProduct = {
  id: string;
  label: string;
  labelAr: string;
  hue: string;
  glyph: string;
};

export type EcoGroup = {
  key: string;
  category: string;
  categoryAr: string;
  products: EcoProduct[];
};

export const ECOSYSTEM_GROUPS: EcoGroup[] = [
  {
    key: "construction",
    category: "Construction",
    categoryAr: "الإنشاءات",
    products: [
      { id: "helmet", label: "Safety helmet", labelAr: "خوذة سلامة", hue: "#E11D48", glyph: "⛑" },
      { id: "cement", label: "Cement", labelAr: "أسمنت", hue: "#78716C", glyph: "▣" },
      { id: "rebar", label: "Steel rebar", labelAr: "حديد تسليح", hue: "#57534E", glyph: "≡" },
      { id: "pipe", label: "Steel pipe", labelAr: "أنابيب فولاذ", hue: "#0EA5E9", glyph: "○" },
      { id: "wire", label: "Cable coil", labelAr: "بكرة كابلات", hue: "#F59E0B", glyph: "◎" },
      { id: "vest", label: "Safety vest", labelAr: "سترة سلامة", hue: "#84CC16", glyph: "▣" },
    ],
  },
  {
    key: "food",
    category: "Food & agriculture",
    categoryAr: "الغذاء والزراعة",
    products: [
      { id: "coffee", label: "Coffee beans", labelAr: "بن", hue: "#7C2D12", glyph: "●" },
      { id: "grain", label: "Grain", labelAr: "حبوب", hue: "#CA8A04", glyph: "◆" },
      { id: "rice", label: "Rice", labelAr: "أرز", hue: "#A8A29E", glyph: "◇" },
      { id: "pack", label: "Packaging", labelAr: "تغليف", hue: "#0369A1", glyph: "▭" },
    ],
  },
  {
    key: "electronics",
    category: "Electronics",
    categoryAr: "الإلكترونيات",
    products: [
      { id: "panel", label: "Control panel", labelAr: "لوحة تحكم", hue: "#1D4ED8", glyph: "▦" },
      { id: "board", label: "Circuit board", labelAr: "لوحة إلكترونية", hue: "#15803D", glyph: "▣" },
      { id: "led", label: "LED lighting", labelAr: "إضاءة LED", hue: "#FACC15", glyph: "✧" },
      { id: "laptop", label: "Industrial PC", labelAr: "حاسوب صناعي", hue: "#334155", glyph: "▭" },
    ],
  },
  {
    key: "industrial",
    category: "Industrial equipment",
    categoryAr: "المعدات الصناعية",
    products: [
      { id: "pump", label: "Industrial pump", labelAr: "مضخة صناعية", hue: "#0F766E", glyph: "◍" },
      { id: "motor", label: "Motor", labelAr: "محرك", hue: "#1E3A8A", glyph: "◉" },
      { id: "valve", label: "Valve", labelAr: "صمام", hue: "#B45309", glyph: "◎" },
      { id: "comp", label: "Compressor", labelAr: "ضاغط", hue: "#475569", glyph: "◍" },
    ],
  },
  {
    key: "textiles",
    category: "Textiles",
    categoryAr: "المنسوجات",
    products: [
      { id: "roll", label: "Fabric roll", labelAr: "لفة قماش", hue: "#BE185D", glyph: "◎" },
      { id: "thread", label: "Thread", labelAr: "خيوط", hue: "#9F1239", glyph: "○" },
      { id: "leather", label: "Leather", labelAr: "جلد", hue: "#78350F", glyph: "▭" },
    ],
  },
  {
    key: "health",
    category: "Healthcare",
    categoryAr: "الرعاية الصحية",
    products: [
      { id: "device", label: "Medical device", labelAr: "جهاز طبي", hue: "#0EA5E9", glyph: "✚" },
      { id: "lab", label: "Lab equipment", labelAr: "معدات مختبر", hue: "#0369A1", glyph: "△" },
      { id: "pharma", label: "Pharma pack", labelAr: "تعبئة دوائية", hue: "#FFFFFF", glyph: "▭" },
    ],
  },
  {
    key: "energy",
    category: "Energy",
    categoryAr: "الطاقة",
    products: [
      { id: "solar", label: "Solar panel", labelAr: "لوح شمسي", hue: "#1E3A8A", glyph: "▦" },
      { id: "batt", label: "Battery", labelAr: "بطارية", hue: "#166534", glyph: "▣" },
      { id: "xfmr", label: "Transformer", labelAr: "محول كهربائي", hue: "#854D0E", glyph: "◆" },
    ],
  },
];

export function ProductEcosystemAnimation({ locale }: { locale: "en" | "ar" }) {
  const [reduce, setReduce] = useState(false);
  const [gi, setGi] = useState(0);
  const group = ECOSYSTEM_GROUPS[gi % ECOSYSTEM_GROUPS.length];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setGi((n) => n + 1), 5200);
    return () => window.clearInterval(t);
  }, [reduce]);

  const nodes = useMemo(() => {
    return group.products.map((p, i) => {
      const angle = (i / group.products.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 34 + (i % 2) * 8;
      return {
        ...p,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * (radius * 0.72),
        z: i % 3,
        delay: i * 0.12,
      };
    });
  }, [group]);

  return (
    <div className="kt-eco" aria-hidden={false} aria-label={locale === "ar" ? group.categoryAr : group.category}>
      <div className="kt-eco__field">
        <div className="kt-eco__core">
          <span>KT</span>
        </div>
        {nodes.map((n) => (
          <div
            key={`${group.key}-${n.id}`}
            className={`kt-eco__item kt-eco__item--z${n.z}${reduce ? " is-static" : ""}`}
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              animationDelay: `${n.delay}s`,
              ["--hue" as string]: n.hue,
            }}
            title={locale === "ar" ? n.labelAr : n.label}
          >
            <span className="kt-eco__glyph">{n.glyph}</span>
          </div>
        ))}
      </div>
      <p className="kt-eco__label">{locale === "ar" ? group.categoryAr : group.category}</p>
    </div>
  );
}
