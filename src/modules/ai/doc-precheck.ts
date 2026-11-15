/** Verification pre-check — extract heuristics + mismatch flags. Human makes final decision. */

export type DocPrecheckInput = {
  type: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  expiryDate?: string | Date | null;
  numberHint?: string;
  /** Declared vendor profile fields for mismatch detection */
  declared?: {
    crNumber?: string;
    vatNumber?: string;
    legalName?: string;
    tradeName?: string;
  };
  /** Optional raw text / OCR stub content */
  ocrText?: string;
};

export type ExtractedDocFields = {
  documentType: string;
  number?: string;
  expiryDate?: string;
  holderName?: string;
  vatNumber?: string;
  crNumber?: string;
  confidence: number;
  source: "ocr_stub" | "hint" | "heuristic";
};

export type DocPrecheckResult = {
  ok: boolean;
  score: number;
  flags: Array<{ code: string; severity: "info" | "warn" | "error"; message: string }>;
  extracted: ExtractedDocFields;
  mismatches: Array<{ field: string; declared?: string; extracted?: string; message: string }>;
  /** Always false until admin approves — AI never auto-verifies */
  humanDecisionRequired: true;
  source: "heuristic";
};

function extractFromText(type: string, text: string, numberHint?: string): ExtractedDocFields {
  const t = text || "";
  const digits = t.replace(/\s/g, "");
  let number = numberHint?.replace(/\s/g, "") || undefined;
  let vatNumber: string | undefined;
  let crNumber: string | undefined;
  let expiryDate: string | undefined;
  let holderName: string | undefined;

  const vatMatch = digits.match(/3\d{14}/);
  if (vatMatch) vatNumber = vatMatch[0];
  const crMatch = digits.match(/(?<![0-9])\d{10}(?![0-9])/);
  if (crMatch && !vatNumber?.includes(crMatch[0])) crNumber = crMatch[0];

  const exp =
    t.match(/expir(?:y|es|ation)[:\s]*([\d/\-.]+)/i) ||
    t.match(/valid\s*(?:until|thru|to)[:\s]*([\d/\-.]+)/i) ||
    t.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
  if (exp) expiryDate = exp[1];

  const nameMatch = t.match(/(?:name|holder|company)[:\s]+([A-Za-z\u0600-\u06FF0-9 .,&-]{3,80})/i);
  if (nameMatch) holderName = nameMatch[1].trim();

  if (type.includes("vat") && vatNumber) number = vatNumber;
  if ((type.includes("cr") || type === "commercial_registration") && crNumber) number = crNumber;
  if (!number && numberHint) number = String(numberHint).replace(/\s/g, "");

  return {
    documentType: type,
    number,
    expiryDate,
    holderName,
    vatNumber,
    crNumber,
    confidence: text.length > 40 ? 0.55 : numberHint ? 0.4 : 0.25,
    source: text.length > 20 ? "ocr_stub" : numberHint ? "hint" : "heuristic",
  };
}

export function precheckVendorDocument(input: DocPrecheckInput): DocPrecheckResult {
  const flags: DocPrecheckResult["flags"] = [];
  const mismatches: DocPrecheckResult["mismatches"] = [];
  let score = 100;
  const type = String(input.type || "other").toLowerCase();
  const name = String(input.fileName || "").toLowerCase();
  const mime = String(input.mimeType || "").toLowerCase();
  const size = Number(input.sizeBytes) || 0;

  const extracted = extractFromText(type, String(input.ocrText || ""), input.numberHint);

  if (size > 0 && size < 8_000) {
    score -= 25;
    flags.push({
      code: "file_too_small",
      severity: "warn",
      message: "File looks unusually small — may be incomplete or low quality.",
    });
  }
  if (size > 12_000_000) {
    score -= 10;
    flags.push({
      code: "file_large",
      severity: "info",
      message: "Large file — prefer PDF under 10MB for faster review.",
    });
  }

  const looksPdf = mime.includes("pdf") || name.endsWith(".pdf");
  const looksImage = /image\/|jpe?g|png|webp/.test(mime + name);
  if (!looksPdf && !looksImage && !input.ocrText) {
    score -= 30;
    flags.push({
      code: "unexpected_type",
      severity: "error",
      message: "Upload a PDF or clear image of the document.",
    });
  }

  if (type.includes("cr") || type === "commercial_registration") {
    const n = extracted.crNumber || extracted.number;
    if (n && !/^\d{7,15}$/.test(n)) {
      score -= 15;
      flags.push({
        code: "cr_format",
        severity: "warn",
        message: "CR number format looks unusual (expect 7–15 digits).",
      });
    }
  }

  if (type.includes("vat")) {
    const n = extracted.vatNumber || extracted.number;
    if (n && !/^3\d{14}$/.test(n)) {
      score -= 15;
      flags.push({
        code: "vat_format",
        severity: "warn",
        message: "Saudi VAT numbers usually start with 3 and are 15 digits.",
      });
    }
  }

  const expiry = input.expiryDate || extracted.expiryDate;
  if (expiry) {
    const exp = new Date(expiry).getTime();
    if (!Number.isNaN(exp)) {
      const left = exp - Date.now();
      const day = 86400000;
      if (left < 0) {
        score -= 40;
        flags.push({
          code: "expired",
          severity: "error",
          message: "Document appears expired — upload a renewed copy.",
        });
      } else if (left < 60 * day) {
        score -= 20;
        flags.push({
          code: "expiring_soon",
          severity: "warn",
          message: "Document expires within 60 days — renew before review delays.",
        });
      }
    }
  }

  const declared = input.declared || {};
  if (declared.crNumber && (extracted.crNumber || extracted.number)) {
    const a = String(declared.crNumber).replace(/\s/g, "");
    const b = String(extracted.crNumber || extracted.number).replace(/\s/g, "");
    if (a && b && a !== b) {
      score -= 25;
      mismatches.push({
        field: "crNumber",
        declared: a,
        extracted: b,
        message: "CR on document does not match declared profile CR.",
      });
      flags.push({
        code: "cr_mismatch",
        severity: "error",
        message: "CR mismatch vs vendor profile — human must decide.",
      });
    }
  }
  if (declared.vatNumber && (extracted.vatNumber || extracted.number)) {
    const a = String(declared.vatNumber).replace(/\s/g, "");
    const b = String(extracted.vatNumber || extracted.number).replace(/\s/g, "");
    if (a && b && a !== b) {
      score -= 25;
      mismatches.push({
        field: "vatNumber",
        declared: a,
        extracted: b,
        message: "VAT on document does not match declared profile VAT.",
      });
      flags.push({
        code: "vat_mismatch",
        severity: "error",
        message: "VAT mismatch vs vendor profile — human must decide.",
      });
    }
  }
  if (declared.legalName && extracted.holderName) {
    const a = declared.legalName.toLowerCase();
    const b = extracted.holderName.toLowerCase();
    if (a.length > 3 && b.length > 3 && !a.includes(b.slice(0, 6)) && !b.includes(a.slice(0, 6))) {
      score -= 10;
      mismatches.push({
        field: "legalName",
        declared: declared.legalName,
        extracted: extracted.holderName,
        message: "Holder/company name may not match legal name.",
      });
      flags.push({
        code: "name_mismatch",
        severity: "warn",
        message: "Name on document may not match profile — review manually.",
      });
    }
  }

  score = Math.max(0, Math.min(100, score));
  return {
    ok: !flags.some((f) => f.severity === "error"),
    score,
    flags,
    extracted,
    mismatches,
    humanDecisionRequired: true,
    source: "heuristic",
  };
}
