/**
 * Regulated / restricted product keywords & categories (risk register H3).
 * License check per category; block or escalate before publish / AI shortlist.
 */

export type RestrictionLevel = "block" | "license_required" | "escalate";

export type RestrictionRule = {
  id: string;
  level: RestrictionLevel;
  keywords: string[];
  categories?: string[];
  note: string;
};

export const RESTRICTED_GOODS: RestrictionRule[] = [
  {
    id: "weapons",
    level: "block",
    keywords: ["weapon", "firearm", "ammunition", "explosive", "سلاح", "ذخيرة", "متفجر"],
    note: "Weapons and explosives are prohibited on Hukum.",
  },
  {
    id: "chemical_weapons",
    level: "block",
    keywords: ["chemical weapon", "nerve agent", "كيماوي حربي"],
    note: "Chemical weapons prohibited.",
  },
  {
    id: "pharma_rx",
    level: "license_required",
    keywords: ["prescription drug", "controlled substance", "دواء وصفة", "مواد مخدرة"],
    categories: ["pharmaceuticals", "pharma", "drugs", "medical", "sfda"],
    note: "Pharmaceuticals require SFDA / license verification.",
  },
  {
    id: "hazardous_chem",
    level: "license_required",
    keywords: ["hazardous chemical", "toxic industrial", "كيماويات خطرة", "مواد سامة"],
    categories: ["chemicals", "hazardous", "oil-gas", "oil_gas"],
    note: "Hazardous chemicals require license and hazard class.",
  },
  {
    id: "medical_devices",
    level: "license_required",
    keywords: ["medical device", "جهاز طبي", "ivd", "implant"],
    categories: ["medical-devices", "medical_devices", "lab-supplies", "lab"],
    note: "Medical devices require SFDA licence before listing goes live.",
  },
  {
    id: "dual_use",
    level: "escalate",
    keywords: ["dual-use", "surveillance kit", "استخدام مزدوج"],
    note: "Dual-use goods escalate to human compliance review.",
  },
];

export function scanRestrictedText(text: string): {
  hit: boolean;
  level?: RestrictionLevel;
  rule?: RestrictionRule;
  matched?: string;
} {
  const lower = String(text || "").toLowerCase();
  if (!lower.trim()) return { hit: false };
  for (const rule of RESTRICTED_GOODS) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return { hit: true, level: rule.level, rule, matched: kw };
      }
    }
  }
  return { hit: false };
}

export function scanRestrictedCategory(categorySlug?: string): {
  hit: boolean;
  level?: RestrictionLevel;
  rule?: RestrictionRule;
  matched?: string;
} {
  const slug = String(categorySlug || "").toLowerCase().replace(/_/g, "-");
  if (!slug.trim()) return { hit: false };
  for (const rule of RESTRICTED_GOODS) {
    for (const c of rule.categories || []) {
      const needle = c.toLowerCase().replace(/_/g, "-");
      if (slug === needle || slug.includes(needle) || needle.includes(slug)) {
        return { hit: true, level: rule.level, rule, matched: c };
      }
    }
  }
  return { hit: false };
}

export function assertPublishableProduct(opts: {
  name?: string;
  description?: string;
  categorySlug?: string;
  licenseNumber?: string;
}): { ok: boolean; level?: RestrictionLevel; message?: string; ruleId?: string } {
  const blob = [opts.name, opts.description].filter(Boolean).join(" ");
  const textScan = scanRestrictedText(blob);
  const catScan = scanRestrictedCategory(opts.categorySlug);
  const scan =
    textScan.hit && textScan.level === "block"
      ? textScan
      : catScan.hit && catScan.level === "block"
        ? catScan
        : textScan.hit
          ? textScan
          : catScan;

  if (!scan.hit || !scan.rule) return { ok: true };

  if (scan.level === "block") {
    return { ok: false, level: "block", message: scan.rule.note, ruleId: scan.rule.id };
  }
  if (scan.level === "license_required" && !String(opts.licenseNumber || "").trim()) {
    return {
      ok: false,
      level: "license_required",
      message: `${scan.rule.note} Provide a license number before publish.`,
      ruleId: scan.rule.id,
    };
  }
  // Escalate: draft OK; caller must force needs_review and refuse publish (Risk H3).
  if (scan.level === "escalate") {
    return {
      ok: true,
      level: "escalate",
      message: `${scan.rule.note} Held for compliance review — cannot go live until cleared.`,
      ruleId: scan.rule.id,
    };
  }
  return { ok: true, level: scan.level, ruleId: scan.rule.id };
}
