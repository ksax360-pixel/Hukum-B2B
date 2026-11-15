import type { CSSProperties } from "react";

type Props = {
  categoryKey: string;
  className?: string;
  style?: CSSProperties;
};

/** Multi-color flat category icons (not monochrome). */
export function CategoryIcon({ categoryKey, className, style }: Props) {
  const common = {
    className,
    style,
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
  };

  switch (categoryKey) {
    case "safety-equipment":
      return (
        <svg {...common}>
          <path d="M16 34c0-12 7-20 16-20s16 8 16 20v6H16v-6z" fill="#E11D48" />
          <path d="M20 40h24v4c0 2-2 4-4 4H24c-2 0-4-2-4-4v-4z" fill="#BE123C" />
          <rect x="30" y="18" width="4" height="10" rx="1" fill="#FCD34D" />
          <path d="M28 28h8v3H28z" fill="#FEF3C7" />
        </svg>
      );
    case "construction":
      return (
        <svg {...common}>
          <rect x="14" y="34" width="36" height="14" rx="2" fill="#EA580C" />
          <rect x="18" y="22" width="10" height="12" fill="#FB923C" />
          <rect x="30" y="16" width="10" height="18" fill="#F97316" />
          <rect x="42" y="26" width="8" height="8" fill="#C2410C" />
          <rect x="20" y="26" width="4" height="4" fill="#FFF7ED" />
          <rect x="32" y="20" width="4" height="4" fill="#FFF7ED" />
        </svg>
      );
    case "building-materials":
      return (
        <svg {...common}>
          <rect x="12" y="38" width="40" height="10" rx="1" fill="#B45309" />
          <rect x="16" y="28" width="14" height="10" fill="#D97706" />
          <rect x="34" y="28" width="14" height="10" fill="#F59E0B" />
          <rect x="24" y="18" width="16" height="10" fill="#92400E" />
        </svg>
      );
    case "fmcg":
      return (
        <svg {...common}>
          <ellipse cx="32" cy="42" rx="14" ry="6" fill="#CA8A04" />
          <path d="M20 42c2-10 6-18 12-22 6 4 10 12 12 22" fill="#FBBF24" />
          <path d="M28 18c4 2 8 2 12 0-2 4-4 6-6 8-2-2-4-4-6-8z" fill="#78350F" />
          <circle cx="34" cy="34" r="2.5" fill="#FFFBEB" />
        </svg>
      );
    case "food-beverage":
      return (
        <svg {...common}>
          <rect x="24" y="18" width="16" height="28" rx="4" fill="#16A34A" />
          <rect x="27" y="22" width="10" height="8" rx="2" fill="#BBF7D0" />
          <circle cx="32" cy="38" r="3" fill="#FACC15" />
          <path d="M30 14h4v5h-4z" fill="#15803D" />
        </svg>
      );
    case "medical-equipment":
      return (
        <svg {...common}>
          <rect x="18" y="24" width="28" height="20" rx="4" fill="#0EA5E9" />
          <path d="M30 18h4v8h-4zM28 20h8v4h-8z" fill="#38BDF8" />
          <path d="M30 30h4v8h-4zm-4 2h12v4H26z" fill="#F0F9FF" />
          <circle cx="42" cy="28" r="3" fill="#F43F5E" />
        </svg>
      );
    case "pharmaceuticals":
      return (
        <svg {...common}>
          <rect x="22" y="16" width="20" height="32" rx="10" fill="#0284C7" />
          <rect x="22" y="30" width="20" height="18" rx="10" fill="#38BDF8" />
          <circle cx="32" cy="24" r="3" fill="#F0F9FF" />
          <circle cx="32" cy="40" r="3" fill="#0369A1" />
        </svg>
      );
    case "lab-scientific":
      return (
        <svg {...common}>
          <path d="M26 14h12v6l8 22a8 8 0 01-8 10H26a8 8 0 01-8-10l8-22v-6z" fill="#6366F1" />
          <path d="M22 36h20c0 6-4 10-10 10s-10-4-10-10z" fill="#A5B4FC" />
          <circle cx="28" cy="40" r="2" fill="#EEF2FF" />
          <circle cx="36" cy="38" r="1.5" fill="#EEF2FF" />
        </svg>
      );
    case "textiles":
      return (
        <svg {...common}>
          <path d="M14 40c6-16 12-24 18-24s12 8 18 24" fill="#DB2777" />
          <path d="M18 40c4-12 8-18 14-18s10 6 14 18" fill="#F472B6" />
          <path d="M22 40c3-8 6-12 10-12s7 4 10 12" fill="#FBCFE8" />
        </svg>
      );
    case "apparel":
      return (
        <svg {...common}>
          <path d="M22 20l10-6 10 6 6 4-4 4-4-2v20H24V26l-4 2-4-4 6-4z" fill="#BE185D" />
          <rect x="26" y="28" width="12" height="14" fill="#F472B6" />
          <path d="M28 20c1.5 2 6.5 2 8 0" stroke="#FBCFE8" strokeWidth="2" />
        </svg>
      );
    case "it-services":
      return (
        <svg {...common}>
          <rect x="12" y="18" width="40" height="26" rx="3" fill="#4F46E5" />
          <rect x="16" y="22" width="32" height="18" fill="#C7D2FE" />
          <path d="M22 28l6 5-6 5M34 28l6 5-6 5" stroke="#4338CA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="24" y="46" width="16" height="3" rx="1" fill="#312E81" />
        </svg>
      );
    case "telecom":
      return (
        <svg {...common}>
          <path d="M32 44a3 3 0 100-6 3 3 0 000 6z" fill="#7C3AED" />
          <path d="M24 34a12 12 0 0116 0" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
          <path d="M18 28a20 20 0 0128 0" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
          <path d="M12 22a28 28 0 0140 0" stroke="#6D28D9" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "electrical":
      return (
        <svg {...common}>
          <path d="M34 12L20 36h12l-2 16 18-28H34l4-12z" fill="#F59E0B" />
          <path d="M34 12l-4 12h10L28 48l1-10H20L34 12z" fill="#FDE68A" opacity="0.7" />
        </svg>
      );
    case "industrial-machinery":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="14" fill="#475569" />
          <circle cx="32" cy="32" r="6" fill="#94A3B8" />
          <rect x="30" y="12" width="4" height="8" fill="#64748B" />
          <rect x="30" y="44" width="4" height="8" fill="#64748B" />
          <rect x="12" y="30" width="8" height="4" fill="#64748B" />
          <rect x="44" y="30" width="8" height="4" fill="#64748B" />
        </svg>
      );
    case "hvac":
      return (
        <svg {...common}>
          <rect x="14" y="20" width="36" height="24" rx="4" fill="#06B6D4" />
          <circle cx="32" cy="32" r="8" fill="#ECFEFF" />
          <path d="M32 24v16M24 32h16M26 26l12 12M38 26L26 38" stroke="#0891B2" strokeWidth="2" />
          <rect x="18" y="24" width="4" height="4" fill="#A5F3FC" />
          <rect x="42" y="36" width="4" height="4" fill="#A5F3FC" />
        </svg>
      );
    case "oil-gas":
      return (
        <svg {...common}>
          <path d="M28 14c0 0-10 14-10 24a14 14 0 0028 0c0-10-10-24-10-24h-8z" fill="#0F766E" />
          <path d="M32 18c0 0-7 10-7 20a7 7 0 0014 0c0-10-7-20-7-20z" fill="#2DD4BF" />
          <ellipse cx="32" cy="42" rx="5" ry="3" fill="#99F6E4" />
        </svg>
      );
    case "renewable-energy":
      return (
        <svg {...common}>
          <circle cx="32" cy="28" r="10" fill="#FACC15" />
          <path d="M32 12v4M32 40v4M16 28h4M44 28h4M20 16l3 3M41 37l3 3M20 40l3-3M41 19l3-3" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" />
          <rect x="18" y="44" width="28" height="6" rx="1" fill="#65A30D" />
          <rect x="20" y="45" width="6" height="4" fill="#A3E635" />
          <rect x="29" y="45" width="6" height="4" fill="#A3E635" />
          <rect x="38" y="45" width="6" height="4" fill="#A3E635" />
        </svg>
      );
    case "automotive":
      return (
        <svg {...common}>
          <path d="M12 36l4-10h8l4-6h12l4 6h8l4 10v6H12v-6z" fill="#DC2626" />
          <rect x="22" y="24" width="8" height="6" rx="1" fill="#FECACA" />
          <rect x="34" y="24" width="8" height="6" rx="1" fill="#FECACA" />
          <circle cx="20" cy="42" r="5" fill="#1F2937" />
          <circle cx="44" cy="42" r="5" fill="#1F2937" />
          <circle cx="20" cy="42" r="2" fill="#9CA3AF" />
          <circle cx="44" cy="42" r="2" fill="#9CA3AF" />
        </svg>
      );
    case "packaging":
      return (
        <svg {...common}>
          <path d="M32 14l16 8v20l-16 8-16-8V22l16-8z" fill="#0F766E" />
          <path d="M32 14v36M16 22l16 8 16-8" stroke="#99F6E4" strokeWidth="2" />
          <path d="M32 30l16-8" stroke="#5EEAD4" strokeWidth="2" />
        </svg>
      );
    case "printing-services":
      return (
        <svg {...common}>
          <rect x="14" y="22" width="36" height="22" rx="3" fill="#1D4ED8" />
          <rect x="20" y="14" width="24" height="12" rx="2" fill="#93C5FD" />
          <rect x="20" y="40" width="24" height="8" rx="1" fill="#DBEAFE" />
          <circle cx="44" cy="30" r="3" fill="#BFDBFE" />
        </svg>
      );
    case "stationery":
      return (
        <svg {...common}>
          <rect x="18" y="14" width="20" height="36" rx="2" fill="#B45309" />
          <rect x="22" y="20" width="12" height="2" fill="#FDE68A" />
          <rect x="22" y="26" width="10" height="2" fill="#FDE68A" />
          <path d="M40 18l8 8-18 18H22V36l18-18z" fill="#F59E0B" />
        </svg>
      );
    case "office-supplies":
      return (
        <svg {...common}>
          <rect x="18" y="14" width="22" height="30" rx="2" fill="#2563EB" />
          <rect x="22" y="18" width="14" height="3" fill="#BFDBFE" />
          <rect x="22" y="24" width="14" height="2" fill="#93C5FD" />
          <rect x="22" y="29" width="10" height="2" fill="#93C5FD" />
          <path d="M36 20l10 4v22l-10-4V20z" fill="#1D4ED8" />
        </svg>
      );
    case "furniture-fitout":
      return (
        <svg {...common}>
          <rect x="14" y="28" width="36" height="6" rx="1" fill="#92400E" />
          <rect x="18" y="34" width="5" height="14" fill="#B45309" />
          <rect x="41" y="34" width="5" height="14" fill="#B45309" />
          <path d="M16 28c4-10 10-14 16-14s12 4 16 14" fill="#D97706" />
        </svg>
      );
    case "lighting":
      return (
        <svg {...common}>
          <path d="M24 28a8 8 0 0116 0c0 4-3 6-4 8h-8c-1-2-4-4-4-8z" fill="#FBBF24" />
          <rect x="28" y="36" width="8" height="6" rx="1" fill="#F59E0B" />
          <rect x="26" y="42" width="12" height="4" rx="1" fill="#D97706" />
          <path d="M32 12v4M20 18l3 3M44 18l-3 3" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "plumbing":
      return (
        <svg {...common}>
          <path d="M20 20h8v8h8v8h8v16H20V20z" fill="#0891B2" />
          <rect x="22" y="22" width="4" height="4" fill="#A5F3FC" />
          <circle cx="40" cy="44" r="4" fill="#22D3EE" />
          <path d="M38 36c4 0 8 2 8 6" stroke="#155E75" strokeWidth="2" />
        </svg>
      );
    case "tools-hardware":
      return (
        <svg {...common}>
          <path d="M38 14l12 12-6 6-4-4-10 10-8-8 10-10-4-4 6-6z" fill="#64748B" />
          <path d="M18 40l6 6-8 8-6-6 8-8z" fill="#F59E0B" />
          <circle cx="44" cy="20" r="3" fill="#94A3B8" />
        </svg>
      );
    case "agriculture":
      return (
        <svg {...common}>
          <path d="M32 44c0-14 10-22 10-22s2 12-2 20" fill="#16A34A" />
          <path d="M32 44c0-14-10-22-10-22s-2 12 2 20" fill="#22C55E" />
          <path d="M32 20v24" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="32" cy="48" rx="12" ry="4" fill="#86EFAC" />
        </svg>
      );
    case "logistics":
      return (
        <svg {...common}>
          <rect x="10" y="26" width="28" height="16" rx="2" fill="#1D4ED8" />
          <path d="M38 30h10l4 6v6H38V30z" fill="#3B82F6" />
          <rect x="40" y="32" width="6" height="5" fill="#BFDBFE" />
          <circle cx="18" cy="44" r="4" fill="#1F2937" />
          <circle cx="42" cy="44" r="4" fill="#1F2937" />
        </svg>
      );
    case "facility-management":
      return (
        <svg {...common}>
          <path d="M14 44V28l18-12 18 12v16H14z" fill="#334155" />
          <rect x="28" y="34" width="8" height="10" fill="#94A3B8" />
          <rect x="18" y="30" width="6" height="6" fill="#CBD5E1" />
          <rect x="40" y="30" width="6" height="6" fill="#CBD5E1" />
        </svg>
      );
    case "cleaning":
      return (
        <svg {...common}>
          <path d="M28 14h8l2 8H26l2-8z" fill="#14B8A6" />
          <rect x="30" y="22" width="4" height="18" fill="#0F766E" />
          <path d="M22 40h20l-2 8H24l-2-8z" fill="#2DD4BF" />
          <circle cx="42" cy="20" r="4" fill="#99F6E4" opacity="0.8" />
        </svg>
      );
    case "chemicals":
      return (
        <svg {...common}>
          <rect x="20" y="16" width="10" height="32" rx="2" fill="#7E22CE" />
          <rect x="34" y="22" width="10" height="26" rx="2" fill="#A855F7" />
          <rect x="22" y="20" width="6" height="8" fill="#E9D5FF" />
          <rect x="36" y="26" width="6" height="6" fill="#F3E8FF" />
          <circle cx="25" cy="40" r="2" fill="#F0ABFC" />
        </svg>
      );
    case "plastics":
      return (
        <svg {...common}>
          <path d="M18 40c0-10 6-20 14-20s14 10 14 20" fill="#A855F7" />
          <ellipse cx="32" cy="40" rx="14" ry="6" fill="#7E22CE" />
          <path d="M26 28c2-4 6-6 6-6s4 2 6 6" stroke="#E9D5FF" strokeWidth="2" />
        </svg>
      );
    case "security-systems":
      return (
        <svg {...common}>
          <path d="M32 14l16 6v12c0 10-8 16-16 18-8-2-16-8-16-18V20l16-6z" fill="#1E3A8A" />
          <path d="M32 20l10 4v8c0 6-5 10-10 11-5-1-10-5-10-11v-8l10-4z" fill="#3B82F6" />
          <circle cx="32" cy="32" r="4" fill="#BFDBFE" />
        </svg>
      );
    case "hospitality":
      return (
        <svg {...common}>
          <path d="M18 40h28v4H18z" fill="#A21CAF" />
          <path d="M22 40c0-10 4-16 10-16s10 6 10 16" fill="#C026D3" />
          <circle cx="32" cy="22" r="4" fill="#F0ABFC" />
          <rect x="30" y="26" width="4" height="6" fill="#E879F9" />
        </svg>
      );
    case "beauty":
      return (
        <svg {...common}>
          <rect x="28" y="14" width="8" height="20" rx="4" fill="#EC4899" />
          <rect x="26" y="34" width="12" height="14" rx="3" fill="#F472B6" />
          <circle cx="32" cy="40" r="3" fill="#FBCFE8" />
          <path d="M22 20c4 2 6 6 6 6M42 20c-4 2-6 6-6 6" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "education":
      return (
        <svg {...common}>
          <path d="M12 28l20-10 20 10-20 10L12 28z" fill="#F97316" />
          <path d="M20 32v10c4 3 8 4 12 4s8-1 12-4V32l-12 6-12-6z" fill="#FB923C" />
          <path d="M48 28v12" stroke="#C2410C" strokeWidth="2" />
          <circle cx="48" cy="42" r="2" fill="#EA580C" />
        </svg>
      );
    case "water-treatment":
      return (
        <svg {...common}>
          <path d="M32 14c0 0-12 14-12 22a12 12 0 0024 0c0-8-12-22-12-22z" fill="#0284C7" />
          <path d="M32 20c0 0-7 9-7 16a7 7 0 0014 0c0-7-7-16-7-16z" fill="#38BDF8" />
          <circle cx="30" cy="34" r="2" fill="#E0F2FE" />
        </svg>
      );
    case "waste-management":
      return (
        <svg {...common}>
          <rect x="20" y="22" width="24" height="26" rx="3" fill="#4D7C0F" />
          <rect x="18" y="18" width="28" height="6" rx="2" fill="#65A30D" />
          <rect x="26" y="14" width="12" height="5" rx="1" fill="#84CC16" />
          <path d="M26 30h12M26 36h12M26 42h8" stroke="#ECFCCB" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "mining":
      return (
        <svg {...common}>
          <path d="M14 44l10-20 8 10 8-14 10 24H14z" fill="#78716C" />
          <path d="M24 24l4 8 4-6 6 10" stroke="#A8A29E" strokeWidth="2" />
          <circle cx="40" cy="22" r="4" fill="#F59E0B" />
        </svg>
      );
    case "home-appliances":
      return (
        <svg {...common}>
          <rect x="18" y="14" width="28" height="36" rx="3" fill="#0D9488" />
          <rect x="22" y="20" width="20" height="14" rx="2" fill="#99F6E4" />
          <circle cx="32" cy="42" r="4" fill="#5EEAD4" />
          <rect x="24" y="18" width="4" height="2" fill="#F0FDFA" />
        </svg>
      );
    case "marketing-services":
      return (
        <svg {...common}>
          <path d="M14 40V28l14-4v20l-14-4z" fill="#E11D48" />
          <path d="M28 24l20-8v32l-20-8V24z" fill="#F43F5E" />
          <circle cx="42" cy="20" r="4" fill="#FB7185" />
        </svg>
      );
    case "company-formation":
      return (
        <svg {...common}>
          <rect x="16" y="20" width="32" height="28" rx="2" fill="#0E7490" />
          <rect x="22" y="26" width="8" height="6" fill="#A5F3FC" />
          <rect x="34" y="26" width="8" height="6" fill="#A5F3FC" />
          <rect x="22" y="36" width="8" height="6" fill="#67E8F9" />
          <rect x="34" y="36" width="8" height="6" fill="#67E8F9" />
          <path d="M28 14l4-4 4 4" fill="#155E75" />
        </svg>
      );
    case "legal-services":
      return (
        <svg {...common}>
          <path d="M32 14v6" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="12" r="3" fill="#1E40AF" />
          <path d="M18 28l14-6 14 6" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" />
          <path d="M20 28v10c0 4 5 8 12 8s12-4 12-8V28" fill="#3B82F6" />
          <rect x="30" y="36" width="4" height="14" fill="#1E3A8A" />
        </svg>
      );
    case "visa-services":
      return (
        <svg {...common}>
          <rect x="14" y="18" width="36" height="28" rx="3" fill="#7C2D12" />
          <rect x="18" y="22" width="28" height="20" rx="2" fill="#FED7AA" />
          <circle cx="28" cy="32" r="5" fill="#C2410C" />
          <rect x="36" y="28" width="8" height="2" fill="#9A3412" />
          <rect x="36" y="33" width="6" height="2" fill="#9A3412" />
        </svg>
      );
    case "accounting-finance":
      return (
        <svg {...common}>
          <rect x="16" y="14" width="32" height="36" rx="3" fill="#166534" />
          <rect x="22" y="22" width="20" height="3" fill="#86EFAC" />
          <rect x="22" y="30" width="14" height="3" fill="#4ADE80" />
          <rect x="22" y="38" width="18" height="3" fill="#86EFAC" />
          <circle cx="42" cy="44" r="6" fill="#22C55E" />
          <path d="M40 44h4M42 42v4" stroke="#14532D" strokeWidth="1.5" />
        </svg>
      );
    case "hr-recruitment":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="7" fill="#9D174D" />
          <circle cx="40" cy="24" r="7" fill="#DB2777" />
          <path d="M12 46c2-8 7-12 12-12s10 4 12 12" fill="#F9A8D4" />
          <path d="M28 46c2-8 7-12 12-12s10 4 12 12" fill="#FBCFE8" />
        </svg>
      );
    case "translation-services":
      return (
        <svg {...common}>
          <rect x="12" y="16" width="22" height="28" rx="2" fill="#6D28D9" />
          <rect x="30" y="20" width="22" height="28" rx="2" fill="#A78BFA" />
          <path d="M18 28h10M18 34h8" stroke="#EDE9FE" strokeWidth="2" />
          <path d="M36 32h10M36 38h8" stroke="#5B21B6" strokeWidth="2" />
        </svg>
      );
    case "professional-services":
      return (
        <svg {...common}>
          <rect x="16" y="28" width="32" height="18" rx="2" fill="#0F172A" />
          <path d="M24 28v-4a8 8 0 0116 0v4" stroke="#334155" strokeWidth="3" />
          <rect x="28" y="34" width="8" height="6" rx="1" fill="#94A3B8" />
          <path d="M20 22l4 4M44 22l-4 4" stroke="#64748B" strokeWidth="2" />
        </svg>
      );
    case "others":
      return (
        <svg {...common}>
          <circle cx="20" cy="32" r="5" fill="#64748B" />
          <circle cx="32" cy="32" r="5" fill="#94A3B8" />
          <circle cx="44" cy="32" r="5" fill="#CBD5E1" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="20" y="20" width="24" height="24" rx="4" fill="#9CA3AF" />
        </svg>
      );
  }
}
