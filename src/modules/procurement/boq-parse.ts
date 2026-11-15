/**
 * BOQ / Excel / CSV → RFQ line items (Buyer procurement tool).
 * Parses CSV and TSV; Excel xlsx handled via ExcelJS when buffer provided.
 */

export type BoqLine = {
  name: { en: string; ar?: string };
  quantity: number;
  unit: string;
  specifications?: string;
  targetPrice?: number;
};

function splitRows(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const delim = lines[0].includes("\t") ? "\t" : ",";
  return lines.map((line) => {
    // simple CSV split respecting quotes
    const cells: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        q = !q;
        continue;
      }
      if (!q && ch === delim) {
        cells.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

function headerIndex(headers: string[], aliases: string[]) {
  const h = headers.map((x) => x.toLowerCase().replace(/\s+/g, ""));
  for (let i = 0; i < h.length; i++) {
    if (aliases.some((a) => h[i].includes(a.replace(/\s+/g, "")))) return i;
  }
  return -1;
}

/** Parse pasted CSV/TSV or BOQ text into line items. */
export function parseBoqText(text: string): { lines: BoqLine[]; warnings: string[] } {
  const warnings: string[] = [];
  const rows = splitRows(text);
  if (rows.length < 2) {
    // freeform: one item per non-empty line "name | qty | unit"
    const lines: BoqLine[] = [];
    for (const raw of text.split(/\r?\n/)) {
      const t = raw.trim();
      if (!t) continue;
      const parts = t.split(/[|\t,;]/).map((p) => p.trim());
      const qty = Number(String(parts[1] || "1").replace(/[^\d.]/g, "")) || 1;
      const maybePrice = parts.length >= 5 ? Number(String(parts[4]).replace(/[^\d.]/g, "")) : NaN;
      const specs =
        parts.length >= 5
          ? parts[3] || undefined
          : parts.slice(3).join(" ") || undefined;
      lines.push({
        name: { en: parts[0] || t },
        quantity: qty,
        unit: parts[2] || "piece",
        specifications: specs,
        targetPrice: !Number.isNaN(maybePrice) && maybePrice > 0 ? maybePrice : undefined,
      });
    }
    if (!lines.length) warnings.push("No lines detected");
    return { lines, warnings };
  }

  const headers = rows[0];
  const iName = headerIndex(headers, ["name", "item", "description", "وصف", "بند", "product"]);
  const iQty = headerIndex(headers, ["qty", "quantity", "كمية", "qnty"]);
  const iUnit = headerIndex(headers, ["unit", "uom", "وحدة"]);
  const iSpec = headerIndex(headers, ["spec", "specs", "specification", "مواصفات", "notes"]);
  const iPrice = headerIndex(headers, ["price", "target", "سعر"]);

  if (iName < 0) warnings.push("Name/description column not found — using column 0");

  const lines: BoqLine[] = [];
  for (const row of rows.slice(1)) {
    const name = (iName >= 0 ? row[iName] : row[0]) || "";
    if (!name.trim()) continue;
    const qtyRaw = iQty >= 0 ? row[iQty] : row[1];
    const quantity = Math.max(1, Number(String(qtyRaw || "1").replace(/[^\d.]/g, "")) || 1);
    const unit = (iUnit >= 0 ? row[iUnit] : row[2]) || "piece";
    const specifications = iSpec >= 0 ? row[iSpec] : undefined;
    const targetPrice =
      iPrice >= 0 && row[iPrice] ? Number(String(row[iPrice]).replace(/[^\d.]/g, "")) : undefined;
    lines.push({
      name: { en: name.trim() },
      quantity,
      unit: String(unit || "piece").toLowerCase().includes("pcs") ? "piece" : String(unit || "piece"),
      specifications: specifications?.trim() || undefined,
      targetPrice: targetPrice && !Number.isNaN(targetPrice) ? targetPrice : undefined,
    });
  }
  if (!lines.length) warnings.push("Header found but no data rows");
  return { lines, warnings };
}

/** Parse xlsx ArrayBuffer via ExcelJS. */
export async function parseBoqExcel(buffer: ArrayBuffer): Promise<{ lines: BoqLine[]; warnings: string[] }> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { lines: [], warnings: ["Empty workbook"] };
  const rows: string[][] = [];
  sheet.eachRow((row) => {
    const cells = (row.values as unknown[])
      .slice(1)
      .map((v) => (v == null ? "" : String(typeof v === "object" && v && "text" in v ? (v as { text: string }).text : v)));
    rows.push(cells);
  });
  const text = rows.map((r) => r.join(",")).join("\n");
  return parseBoqText(text);
}
