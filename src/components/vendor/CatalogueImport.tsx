"use client";
// Catalogue upload: drop a price list (Excel or CSV) or paste from Excel, check the rows, add them as drafts.
// Parsing happens in the browser and nothing is invented: unreadable cells stay empty for the supplier to fill.

import Link from "next/link";
import { useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { toast } from "@/components/ui/Feedback";
import { readRows } from "@/lib/read-sheet";
import { CATALOGUE_TEMPLATE, parseCatalogue, type CatalogueRow } from "@/lib/parse-catalogue";
import { unitLabel } from "@/lib/money";

const MAX_BYTES = 8 * 1024 * 1024;
type Report = { uploaded: number; created: number; duplicates: number; missingFields: number };

export function CatalogueImport({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CatalogueRow[]>([]);
  const [file, setFile] = useState("");
  const [paste, setPaste] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const take = (raw: unknown[][], label: string) => {
    const { rows: parsed } = parseCatalogue(raw);
    if (!parsed.length) {
      toast(L("We couldn't find a header row with Name, SKU or Price. Use the template's column names.", "ما لقينا صف عناوين فيه الاسم أو الرمز أو السعر. استخدم أسماء أعمدة النموذج."), "error");
      return;
    }
    setRows(parsed);
    setFile(label);
    setReport(null);
  };
  const onFile = async (f?: File) => {
    if (!f) return;
    if (f.size > MAX_BYTES) return toast(L("File is over 8 MB. Split it into smaller files.", "الملف أكبر من ٨ ميجا. قسّمه لملفات أصغر."), "error");
    try {
      take(await readRows(f), f.name);
    } catch {
      toast(L("Couldn't read that file. Save it as .xlsx or .csv and try again.", "ما قدرنا نقرأ الملف. احفظه بصيغة xlsx أو csv وحاول مرة ثانية."), "error");
    }
  };
  const onPaste = () => take(paste.split(/\r?\n/).map((l) => l.split("\t")), L("Pasted rows", "صفوف ملصوقة"));
  const template = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + CATALOGUE_TEMPLATE], { type: "text/csv;charset=utf-8" }));
    a.download = "hukum-catalogue-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const edit = (i: number, k: keyof CatalogueRow, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const missingName = rows.filter((r) => !r.name_en && !r.name_ar).length;

  const add = async () => {
    setBusy(true);
    try {
      const j = await (await fetch("/api/import-export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) })).json();
      if (!j.success) throw new Error(j.message);
      setReport(j.data.report as Report);
      setRows([]);
    } catch (e) {
      toast((e as Error).message || L("Upload failed. Try again.", "فشل الرفع. حاول مرة ثانية."), "error");
    } finally {
      setBusy(false);
    }
  };

  if (report) {
    return (
      <section className="sfe-card ci-done">
        <CheckCircle2 size={28} aria-hidden />
        <h2>{L(`${report.created} product${report.created === 1 ? "" : "s"} added as drafts`, `أُضيف ${report.created} منتج كمسودات`)}</h2>
        <p>
          {report.duplicates ? L(`${report.duplicates} skipped because the SKU is already in your catalogue. `, `${report.duplicates} تم تخطيها لأن الرمز موجود في كتالوجك. `) : ""}
          {L("Add a photo and category to each, then send them for review.", "أضف صورة وفئة لكل منتج، ثم أرسلها للمراجعة.")}
        </p>
        <div className="ci-done__act">
          <Link href={`/${locale}/vendor/products?tab=draft`} className="qb-send">{L("Finish your drafts", "أكمل المسودات")}</Link>
          <button type="button" className="bh-btn" onClick={() => setReport(null)}>{L("Upload another file", "ارفع ملف ثاني")}</button>
        </div>
      </section>
    );
  }

  if (rows.length) {
    return (
      <section className="sfe-card ci-review" aria-labelledby="ci-h">
        <div className="ci-review__head">
          <div className="sfe-card__head">
            <h2 id="ci-h"><FileSpreadsheet size={18} aria-hidden /> {file}</h2>
            <p>{L(`${rows.length} products found. Fix anything that looks off; you can edit each one later too.`, `لقينا ${rows.length} منتج. صحّح أي شي غلط؛ وتقدر تعدل كل منتج بعدين.`)}</p>
          </div>
          <button type="button" className="bh-btn bh-btn--sm" onClick={() => setRows([])}>{L("Choose another file", "اختر ملف ثاني")}</button>
        </div>
        <div className="ci-table-wrap">
          <table className="ci-table">
            <thead>
              <tr>
                <th scope="col">{L("Name", "الاسم")}</th><th scope="col">{L("Arabic name", "الاسم بالعربي")}</th><th scope="col">{L("SKU", "الرمز")}</th>
                <th scope="col">{L("Brand", "العلامة")}</th><th scope="col">{L("Price, SAR", "السعر، ريال")}</th><th scope="col">{L("Unit", "الوحدة")}</th><th scope="col"><span className="sr-only">{L("Remove", "حذف")}</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((r, i) => (
                <tr key={i} className={!r.name_en && !r.name_ar ? "is-bad" : ""}>
                  <td><input aria-label={L("Name", "الاسم")} value={r.name_en} onChange={(e) => edit(i, "name_en", e.target.value)} /></td>
                  <td><input aria-label={L("Arabic name", "الاسم بالعربي")} dir="rtl" value={r.name_ar} onChange={(e) => edit(i, "name_ar", e.target.value)} /></td>
                  <td><input aria-label="SKU" dir="ltr" value={r.sku} onChange={(e) => edit(i, "sku", e.target.value)} /></td>
                  <td><input aria-label={L("Brand", "العلامة")} value={r.brand} onChange={(e) => edit(i, "brand", e.target.value)} /></td>
                  <td><input aria-label={L("Price", "السعر")} dir="ltr" inputMode="decimal" value={r.price} onChange={(e) => edit(i, "price", e.target.value.replace(/[^\d.]/g, ""))} /></td>
                  <td className="ci-unit">{r.unit ? unitLabel(r.unit, locale) : "—"}</td>
                  <td><button type="button" className="sfe-remove" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} aria-label={L("Remove row", "احذف الصف")}><Trash2 size={15} aria-hidden /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 200 ? <p className="van-note">{L(`Showing the first 200 of ${rows.length}. All of them will be added.`, `نعرض أول ٢٠٠ من ${rows.length}. كلها بتنضاف.`)}</p> : null}
        <div className="sfe-act ci-act">
          <span className="pe-bar__hint">{missingName ? L(`${missingName} row${missingName === 1 ? " has" : "s have"} no name and will be skipped unless it has a SKU.`, `${missingName} صف بدون اسم وبيتخطى إذا ما فيه رمز.`) : L("They'll be saved as drafts. Nothing goes live until you send it for review.", "بتنحفظ كمسودات. ما ينشر شي لين ترسله للمراجعة.")}</span>
          <button type="button" className="qb-send" disabled={busy} onClick={add}>{busy ? L("Adding…", "جارٍ الإضافة…") : L(`Add ${rows.length} products as drafts`, `أضف ${rows.length} منتج كمسودات`)}</button>
        </div>
      </section>
    );
  }

  return (
    <div className="ci-start">
      <section
        className={`ci-drop${drag ? " is-drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
      >
        <Upload size={28} aria-hidden />
        <h2>{L("Drop your price list here", "اسحب قائمة أسعارك هنا")}</h2>
        <p>{L("Excel (.xlsx) or CSV, up to 500 products. Columns we read: Name, Arabic name, SKU, Brand, Price, Unit, MOQ, Description.", "Excel أو CSV، لين ٥٠٠ منتج. الأعمدة: الاسم، الاسم بالعربي، الرمز، العلامة، السعر، الوحدة، أقل كمية، الوصف.")}</p>
        <div className="ci-drop__act">
          <button type="button" className="qb-send" onClick={() => input.current?.click()}>{L("Choose a file", "اختر ملف")}</button>
          <button type="button" className="bh-btn" onClick={template}><Download size={15} aria-hidden /> {L("Download the template", "حمّل النموذج")}</button>
        </div>
        <input ref={input} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      </section>
      <section className="sfe-card ci-paste" aria-labelledby="ci-paste">
        <div className="sfe-card__head">
          <h2 id="ci-paste">{L("Or paste from Excel", "أو الصق من Excel")}</h2>
          <p>{L("Copy the rows including the header row, then paste.", "انسخ الصفوف مع صف العناوين، ثم الصق.")}</p>
        </div>
        <textarea rows={6} dir="ltr" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Name\tSKU\tPrice\nSafety helmet\tHLM-1\t24.50"} aria-label={L("Pasted rows", "الصفوف الملصوقة")} />
        <div className="sfe-act"><button type="button" className="bh-btn" disabled={!paste.trim()} onClick={onPaste}>{L("Read pasted rows", "اقرأ الصفوف")}</button></div>
      </section>
    </div>
  );
}
