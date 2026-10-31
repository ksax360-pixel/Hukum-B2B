import { getRfqFieldsForCategory, getTemplateForCategoryKey, type AttributeDef } from "@/data/attribute-templates";

export type RfqInheritedField = AttributeDef & {
  buyerLabel: { en: string; ar: string };
  hint: { en: string; ar: string };
};

/**
 * RFQ forms inherit category attribute templates so buyers specify
 * requirements using the same schema vendors use for products.
 */
export function buildRfqSchemaForCategory(categoryKey: string): {
  templateKey: string;
  fields: RfqInheritedField[];
} {
  const tpl = getTemplateForCategoryKey(categoryKey);
  const fields = getRfqFieldsForCategory(categoryKey).map((attr) => ({
    ...attr,
    buyerLabel: {
      en: `Required ${attr.label.en}`,
      ar: `${attr.label.ar} المطلوب`,
    },
    hint: {
      en: attr.type === "measurement_range" || attr.type === "range"
        ? "Enter a range if flexible (e.g. 500–1000)."
        : "Match the specification you need from suppliers.",
      ar:
        attr.type === "measurement_range" || attr.type === "range"
          ? "أدخل نطاقاً إن كان مرناً (مثال: 500–1000)."
          : "حدد المواصفة المطلوبة من الموردين.",
    },
  }));

  return {
    templateKey: tpl?.key || "generic",
    fields,
  };
}

export function matchScoreFromRequirements(
  productAttributes: Record<string, unknown>,
  requirements: Record<string, unknown>
): { score: number; matched: string[]; missing: string[] } {
  const keys = Object.keys(requirements).filter((k) => requirements[k] != null && requirements[k] !== "");
  if (!keys.length) return { score: 0, matched: [], missing: [] };

  const matched: string[] = [];
  const missing: string[] = [];

  for (const key of keys) {
    const req = requirements[key];
    const val = productAttributes[key];
    if (val == null || val === "") {
      missing.push(key);
      continue;
    }
    if (typeof req === "string" && typeof val === "string") {
      if (val.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(val.toLowerCase())) {
        matched.push(key);
      } else {
        missing.push(key);
      }
    } else if (Array.isArray(req)) {
      const valArr = Array.isArray(val) ? val.map(String) : [String(val)];
      if (req.some((r) => valArr.some((v) => v.toLowerCase() === String(r).toLowerCase()))) matched.push(key);
      else missing.push(key);
    } else if (typeof req === "object" && req && "min" in (req as object)) {
      const num = Number(val);
      const { min, max } = req as { min?: number; max?: number };
      if ((min == null || num >= min) && (max == null || num <= max)) matched.push(key);
      else missing.push(key);
    } else if (String(val) === String(req)) {
      matched.push(key);
    } else {
      missing.push(key);
    }
  }

  return {
    score: Math.round((matched.length / keys.length) * 100),
    matched,
    missing,
  };
}
