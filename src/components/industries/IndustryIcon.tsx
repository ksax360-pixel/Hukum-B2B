import type { CSSProperties } from "react";

type Props = {
  industryKey: string;
  className?: string;
  style?: CSSProperties;
};

const PHOTO: Record<string, string> = {
  "safety-ppe": "/categories/safety-equipment.jpg",
  construction: "/categories/construction.jpg",
  fmcg: "/categories/fmcg.jpg",
  healthcare: "/categories/medical-equipment.jpg",
  "apparel-textiles": "/categories/textiles.jpg",
  "technology-services": "/categories/it-services.jpg",
  industrial: "/categories/industrial-machinery.jpg",
  energy: "/categories/renewable-energy.jpg",
  automotive: "/categories/automotive.jpg",
  "business-supplies": "/categories/office-supplies.jpg",
  agriculture: "/categories/agriculture.jpg",
  logistics: "/categories/logistics.jpg",
  services: "/categories/professional-services.jpg",
  hospitality: "/categories/hospitality.jpg",
  "business-services": "/categories/company-formation.jpg",
  general: "/categories/others.jpg",
};

/** Realistic industry photos (not illustrated icons). */
export function IndustryIcon({ industryKey, className, style }: Props) {
  const src = PHOTO[industryKey] || "/categories/others.jpg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      style={{ objectFit: "cover", borderRadius: "50%", ...style }}
    />
  );
}
