import ExcelJS from "exceljs";
import { aiProvider } from "@/modules/ai/provider";

export type OnboardingCompanyFields = {
  legalNameEn?: string;
  legalNameAr?: string;
  tradeName?: string;
  companyType?: string;
  crNumber?: string;
  vatNumber?: string;
  yearEstablished?: string;
  website?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  region?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  marketsServed?: string;
  paymentTerms?: string;
  leadTime?: string;
  moq?: string;
  authorizedRep?: string;
};

const COMPANY_TYPES = [
  "manufacturer",
  "distributor",
  "wholesaler",
  "trading_company",
  "service_provider",
  "importer",
  "exporter",
  "oem",
  "other",
] as const;

const REGIONS = ["Riyadh", "Makkah", "Eastern", "Madinah", "Asir", "Tabuk", "Qassim", "Hail", "Other"];

const FIELD_ALIASES: Record<keyof OnboardingCompanyFields, string[]> = {
  legalNameEn: ["legal name", "company name", "legal company name", "اسم الشركة", "legalnameen", "name en"],
  legalNameAr: ["legal name ar", "company name ar", "اسم الشركة بالعربي", "legalnamear", "name ar"],
  tradeName: ["trade name", "brand name", "trading name", "الاسم التجاري"],
  companyType: ["company type", "business type", "نوع الشركة"],
  crNumber: ["cr", "cr number", "commercial registration", "رقم السجل", "crnumber"],
  vatNumber: ["vat", "vat number", "tax number", "الرقم الضريبي", "vatnumber"],
  yearEstablished: ["year established", "founded", "established", "سنة التأسيس"],
  website: ["website", "url", "site", "الموقع"],
  email: ["email", "e-mail", "business email", "البريد"],
  phone: ["phone", "tel", "telephone", "mobile", "الهاتف"],
  whatsapp: ["whatsapp", "wa", "واتساب"],
  country: ["country", "الدولة"],
  region: ["region", "province", "المنطقة"],
  city: ["city", "المدينة"],
  address: ["address", "street", "national address", "العنوان"],
  postalCode: ["postal", "postal code", "zip", "الرمز البريدي"],
  descriptionEn: ["description", "about", "profile", "الوصف", "description en"],
  descriptionAr: ["description ar", "about ar"],
  marketsServed: ["markets", "markets served", "الأسواق"],
  paymentTerms: ["payment terms", "شروط الدفع"],
  leadTime: ["lead time", "delivery time", "مدة التوريد"],
  moq: ["moq", "minimum order", "الحد الأدنى"],
  authorizedRep: ["authorized representative", "representative", "الممثل"],
};

function clean(s: string) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(text: string, re: RegExp) {
  const m = text.match(re);
  return m ? clean(m[1] || m[0]) : "";
}

function detectCompanyType(blob: string) {
  const t = blob.toLowerCase();
  if (/manufactur|مصنع|إنتاج/.test(t)) return "manufacturer";
  if (/distribut|موزع/.test(t)) return "distributor";
  if (/wholesale|جملة/.test(t)) return "wholesaler";
  if (/import|استيراد/.test(t)) return "importer";
  if (/export|تصدير/.test(t)) return "exporter";
  if (/oem/.test(t)) return "oem";
  if (/service|خدمات/.test(t)) return "service_provider";
  if (/trad|تجار/.test(t)) return "trading_company";
  return undefined;
}

function detectRegion(blob: string) {
  for (const r of REGIONS) {
    if (new RegExp(r, "i").test(blob)) return r;
  }
  if (/الرياض|riyadh/i.test(blob)) return "Riyadh";
  if (/جدة|jeddah|makkah|مكة/i.test(blob)) return "Makkah";
  if (/الدمام|dammam|khobar|الخبر|eastern|الشرقية/i.test(blob)) return "Eastern";
  return undefined;
}

function detectCity(blob: string) {
  const cities = [
    ["Riyadh", /riyadh|الرياض/i],
    ["Jeddah", /jeddah|جدة/i],
    ["Dammam", /dammam|الدمام/i],
    ["Khobar", /khobar|الخبر/i],
    ["Madinah", /madinah|medina|المدينة/i],
    ["Makkah", /makkah|mecca|مكة/i],
    ["Tabuk", /tabuk|تبوك/i],
  ] as const;
  for (const [city, re] of cities) {
    if (re.test(blob)) return city;
  }
  return undefined;
}

/** Heuristic parse of free text / HTML-stripped content into onboarding fields. */
export function heuristicExtractCompany(raw: string, sourceUrl?: string): OnboardingCompanyFields {
  const text = clean(raw).slice(0, 200000);
  const email = firstMatch(text, /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phone = firstMatch(text, /(\+966[\s-]?5\d{8}|\+966[\s-]?1\d{8}|05\d{8})/);
  const crNumber = firstMatch(
    text,
    /(?:CR|C\.R\.|Commercial Registration|CR number|السجل التجاري)[:\s#|]*([0-9]{10})\b/i
  );
  const vatNumber = firstMatch(text, /(?:VAT|VAT number|Tax|الرقم الضريبي)[:\s#|]*(3[0-9]{14})\b/i);
  const yearEstablished = firstMatch(text, /(?:established|founded|since|تأسست|سنة)[:\s]*([12][0-9]{3})/i);
  const website =
    sourceUrl ||
    firstMatch(text, /(https?:\/\/[^\s"'<>]+)/i) ||
    firstMatch(text, /\b((?:www\.)[a-z0-9.-]+\.[a-z]{2,})\b/i);

  // Prefer title-like first line for company name
  const lines = text
    .split(/\n+/)
    .map(clean)
    .filter((l) => l.length > 2 && l.length < 120);
  let legalNameEn = "";
  for (const line of lines.slice(0, 12)) {
    if (/@|http|phone|email|vat|cr\b/i.test(line)) continue;
    if (/^[A-Za-z0-9][A-Za-z0-9 &.,'"()-]{2,80}$/.test(line)) {
      legalNameEn = line;
      break;
    }
  }
  const legalNameAr = firstMatch(text, /([\u0600-\u06FF][\u0600-\u06FF\s&.-]{3,80})/);

  const address = firstMatch(
    text,
    /(?:Address|National Address|العنوان)[:\s]+([^\n]{8,160})/i
  );
  const postalCode = firstMatch(text, /(?:Postal|ZIP|الرمز البريدي)[:\s]*([0-9]{4,6})/i);

  const descLines = lines.filter((l) => l.length > 40).slice(0, 4);
  const descriptionEn = descLines.join(" ").slice(0, 800);

  const out: OnboardingCompanyFields = {
    legalNameEn: legalNameEn || undefined,
    legalNameAr: legalNameAr || undefined,
    tradeName: legalNameEn || undefined,
    companyType: detectCompanyType(text),
    crNumber: crNumber && /^\d{10}$/.test(crNumber) ? crNumber : undefined,
    vatNumber: vatNumber && /^\d{15}$/.test(vatNumber) ? vatNumber : undefined,
    yearEstablished: yearEstablished || undefined,
    website: website ? (website.startsWith("http") ? website : `https://${website}`) : undefined,
    email: email || undefined,
    phone: phone || undefined,
    whatsapp: phone || undefined,
    country: "SA",
    region: detectRegion(text),
    city: detectCity(text),
    address: address || undefined,
    postalCode: postalCode || undefined,
    descriptionEn: descriptionEn || undefined,
    marketsServed: /gcc|ksa|saudi|export/i.test(text) ? "KSA, GCC" : undefined,
  };

  return compactFields(out);
}

function compactFields(fields: OnboardingCompanyFields): OnboardingCompanyFields {
  const out: OnboardingCompanyFields = {};
  for (const [k, v] of Object.entries(fields) as [keyof OnboardingCompanyFields, string | undefined][]) {
    if (v != null && String(v).trim()) out[k] = String(v).trim();
  }
  if (out.companyType && !COMPANY_TYPES.includes(out.companyType as (typeof COMPANY_TYPES)[number])) {
    out.companyType = detectCompanyType(out.companyType) || "trading_company";
  }
  return out;
}

function normalizeKey(k: string) {
  return clean(k).toLowerCase().replace(/[_-]+/g, " ");
}

function mapAliasToField(key: string): keyof OnboardingCompanyFields | null {
  const n = normalizeKey(key);
  // Exact alias match first (avoids "cr" matching inside "description")
  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [keyof OnboardingCompanyFields, string[]][]) {
    if (aliases.some((a) => n === a)) return field;
  }
  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [keyof OnboardingCompanyFields, string[]][]) {
    if (aliases.some((a) => a.length >= 4 && (n.includes(a) || a.includes(n)))) return field;
  }
  return null;
}

/** Parse Excel/CSV-like key-value or header row into onboarding fields. */
export async function extractFromExcelBuffer(buffer: Buffer): Promise<{
  fields: OnboardingCompanyFields;
  rawPreview: string;
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { fields: {}, rawPreview: "" };

  const pairs: Array<[string, string]> = [];
  const rows: string[][] = [];

  sheet.eachRow((row, rowNumber) => {
    const values = (row.values as unknown[])
      .slice(1)
      .map((c) => clean(c == null ? "" : String(typeof c === "object" && c && "text" in c ? (c as { text: string }).text : c)));
    rows.push(values);
    if (values.length >= 2 && values[0] && values[1]) {
      pairs.push([values[0], values[1]]);
    }
    // Also support header row on first line
    if (rowNumber === 1 && values.length >= 2) {
      /* handled below */
    }
  });

  const fields: OnboardingCompanyFields = {};
  for (const [k, v] of pairs) {
    const field = mapAliasToField(k);
    if (field) fields[field] = v;
  }

  // Header + single data row
  if (rows.length >= 2 && rows[0].length >= 3) {
    const headers = rows[0];
    const data = rows[1];
    headers.forEach((h, i) => {
      const field = mapAliasToField(h);
      if (field && data[i]) fields[field] = data[i];
    });
  }

  const rawPreview = rows
    .slice(0, 30)
    .map((r) => r.join(" | "))
    .join("\n");

  // Spreadsheet mappings win over free-text heuristics
  const heuristic = heuristicExtractCompany(rawPreview);
  const mapped = compactFields(fields);
  const merged = compactFields({ ...heuristic, ...mapped });
  // Never let heuristic overwrite a clearly mapped CR/VAT/email
  if (mapped.crNumber) merged.crNumber = mapped.crNumber;
  if (mapped.vatNumber) merged.vatNumber = mapped.vatNumber;
  if (mapped.email) merged.email = mapped.email;
  if (mapped.phone) {
    merged.phone = mapped.phone;
    merged.whatsapp = mapped.whatsapp || mapped.phone;
  }
  if (mapped.legalNameEn) merged.legalNameEn = mapped.legalNameEn;
  if (mapped.descriptionEn) merged.descriptionEn = mapped.descriptionEn;
  return { fields: merged, rawPreview };
}

export async function extractFromPdfBuffer(buffer: Buffer): Promise<{
  fields: OnboardingCompanyFields;
  rawPreview: string;
}> {
  // pdf-parse is CJS
  const pdfParse = (await import("pdf-parse")).default as (buf: Buffer) => Promise<{ text: string }>;
  const parsed = await pdfParse(buffer);
  const text = clean(parsed.text || "");
  return {
    fields: heuristicExtractCompany(text),
    rawPreview: text.slice(0, 4000),
  };
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function assertSafePublicUrl(rawUrl: string) {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw Object.assign(new Error("Invalid URL"), { status: 400 });
  }
  if (!["http:", "https:"].includes(u.protocol)) {
    throw Object.assign(new Error("Only http/https URLs are allowed"), { status: 400 });
  }
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "metadata.google.internal" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host === "0.0.0.0" ||
    host === "::1"
  ) {
    throw Object.assign(new Error("Private or local URLs are not allowed"), { status: 400 });
  }
  return u.toString();
}

export async function extractFromWebsiteUrl(url: string): Promise<{
  fields: OnboardingCompanyFields;
  rawPreview: string;
  sourceUrl: string;
}> {
  const sourceUrl = assertSafePublicUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "HijraB2B-OnboardingBot/1.0 (+seller-onboarding)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      throw Object.assign(new Error(`Website returned HTTP ${res.status}`), { status: 422 });
    }
    const html = (await res.text()).slice(0, 500000);
    const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaDesc = firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const ogSite = firstMatch(html, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
    const text = [title, ogSite, metaDesc, stripHtml(html)].filter(Boolean).join("\n");
    const fields = heuristicExtractCompany(text, sourceUrl);
    if (!fields.legalNameEn && (ogSite || title)) {
      fields.legalNameEn = clean((ogSite || title).split("|")[0].split("-")[0]);
      fields.tradeName = fields.legalNameEn;
    }
    if (!fields.descriptionEn && metaDesc) fields.descriptionEn = metaDesc.slice(0, 800);
    fields.website = sourceUrl;
    return { fields: compactFields(fields), rawPreview: text.slice(0, 4000), sourceUrl };
  } finally {
    clearTimeout(timer);
  }
}

const AI_SYSTEM = `You extract Saudi B2B seller company profile fields from source text.
Return ONLY JSON with any of these keys (omit unknowns, never invent CR/VAT):
legalNameEn, legalNameAr, tradeName, companyType (one of: manufacturer,distributor,wholesaler,trading_company,service_provider,importer,exporter,oem,other),
crNumber (10 digits), vatNumber (15 digits), yearEstablished, website, email, phone, whatsapp,
country (prefer SA), region (Riyadh|Makkah|Eastern|Madinah|Asir|Tabuk|Qassim|Hail|Other),
city, address, postalCode, descriptionEn, descriptionAr, marketsServed, paymentTerms, leadTime, moq, authorizedRep.`;

export async function enhanceWithAi(
  fields: OnboardingCompanyFields,
  rawPreview: string
): Promise<{ fields: OnboardingCompanyFields; usedAi: boolean }> {
  if (!aiProvider.isConfigured()) {
    return { fields, usedAi: false };
  }
  try {
    const result = await aiProvider.complete(
      [
        { role: "system", content: AI_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            heuristic: fields,
            sourceText: rawPreview.slice(0, 14000),
          }),
        },
      ],
      { temperature: 0.1 }
    );
    const match = result.content.match(/\{[\s\S]*\}/);
    if (!match) return { fields, usedAi: true };
    const parsed = JSON.parse(match[0]) as OnboardingCompanyFields;
    // Prefer AI only when it provides a value; keep heuristic CR/VAT if AI omitted
    const merged: OnboardingCompanyFields = { ...fields };
    for (const [k, v] of Object.entries(parsed) as [keyof OnboardingCompanyFields, string][]) {
      if (v != null && String(v).trim()) merged[k] = String(v).trim();
    }
    return { fields: compactFields(merged), usedAi: true };
  } catch {
    return { fields, usedAi: false };
  }
}
