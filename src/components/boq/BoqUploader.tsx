"use client";

// BOQ upload that works without a server parser: the file is read in the browser (Excel via exceljs,
// CSV via papaparse), the buyer fixes the lines in a table, then the lines become one multi-item
// request through the normal request form (which handles sign-in, matching and the draft).

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { parseBoqRows } from "@/lib/parse-boq";
import { readRows } from "@/lib/read-sheet";
import type { ItemLine } from "@/lib/parse-item-list";

const UNITS = [
  { v: "piece", en: "Piece", ar: "قطعة" }, { v: "set", en: "Set", ar: "طقم" }, { v: "box", en: "Box", ar: "صندوق" },
  { v: "carton", en: "Carton", ar: "كرتون" }, { v: "pair", en: "Pair", ar: "زوج" }, { v: "bag", en: "Bag", ar: "كيس" },
  { v: "roll", en: "Roll", ar: "لفة" }, { v: "kg", en: "Kilogram", ar: "كيلوغرام" }, { v: "ton", en: "Ton", ar: "طن" },
  { v: "meter", en: "Metre", ar: "متر" }, { v: "sqm", en: "Square metre", ar: "متر مربع" }, { v: "liter", en: "Litre", ar: "لتر" },
];
const MAX_BYTES = 8 * 1024 * 1024;
const TEMPLATE = "Description,Unit,Qty\nSafety helmet EN 397 white,pcs,500\nNitrile coated gloves,pairs,1000\nCement 50kg,bags,200\n";

export function BoqUploader({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [lines, setLines] = useState<ItemLine[]>([]);
  const [fileName, setFileName] = useState("");
  const [paste, setPaste] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = (rows: unknown[][], label: string) => {
    const parsed = parseBoqRows(rows).map((l) => ({ ...l, unit: l.unit || "piece" }));
    if (!parsed.length) {
      setError(L("We couldn't find item lines in that file. Check it has an item or description column.", "ما لقينا بنود في الملف. تأكد إن فيه عمود للبند أو الوصف."));
      return;
    }
    setError("");
    setFileName(label);
    setLines(parsed);
  };

  async function onFile(file?: File | null) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(L("That file is over 8 MB. Split it or save only the item sheet.", "الملف أكبر من 8 ميجا. قسّمه أو احفظ ورقة البنود فقط."));
      return;
    }
    setBusy(true);
    try {
      load(await readRows(file), file.name);
    } catch (e) {
      setError(
        (e as Error).message === "xls"
          ? L("Old .xls files can't be read. Save it as .xlsx or .csv and upload again.", "ملفات xls القديمة ما تنقرأ. احفظه xlsx أو csv وارفعه مرة ثانية.")
          : L("We couldn't read that file. Try saving it as .csv.", "ما قدرنا نقرأ الملف. جرّب تحفظه csv.")
      );
    } finally {
      setBusy(false);
    }
  }

  function continueToRequest() {
    const clean = lines.filter((l) => l.name.trim());
    if (!clean.length) return;
    const [first, ...rest] = clean;
    try {
      // Same draft the request form restores after sign-in, so every line arrives pre-filled.
      localStorage.setItem(
        "hukum_rfq_draft",
        JSON.stringify({
          itemName: first.name,
          quantity: first.qty,
          unit: first.unit || "piece",
          specifications: fileName ? `From ${fileName}` : "",
          extra: JSON.stringify(rest.map((l) => ({ name: l.name, qty: l.qty, unit: l.unit || "piece", specs: "" }))),
        })
      );
    } catch {
      setError(L("Your browser blocked saving the list. Allow site storage and try again.", "المتصفح منع حفظ القائمة. اسمح بالتخزين وجرّب مرة ثانية."));
      return;
    }
    router.push(`/${locale}/rfq?from=boq`);
  }

  const set = (i: number, patch: Partial<ItemLine>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  if (lines.length) {
    return (
      <div className="boq-review">
        <div className="boq-review__head">
          <p>
            <FileSpreadsheet size={18} aria-hidden /> <b>{fileName}</b>
            <span>{L(`${lines.length} lines found. Fix anything that looks off.`, `لقينا ${lines.length} بند. عدّل أي شي غلط.`)}</span>
          </p>
          <button type="button" className="boq-link" onClick={() => { setLines([]); setFileName(""); }}>{L("Use another file", "استخدم ملفاً آخر")}</button>
        </div>
        <div className="boq-table" role="table" aria-label={L("Items", "البنود")}>
          <div className="boq-row boq-row--head" role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">{L("Item", "البند")}</span>
            <span role="columnheader">{L("Qty", "الكمية")}</span>
            <span role="columnheader">{L("Unit", "الوحدة")}</span>
            <span role="columnheader"><span className="sr-only">{L("Remove", "حذف")}</span></span>
          </div>
          {lines.map((l, i) => (
            <div key={i} className="boq-row" role="row">
              <span role="cell" className="boq-n">{i + 1}</span>
              <span role="cell"><input aria-label={L(`Item ${i + 1}`, `البند ${i + 1}`)} value={l.name} onChange={(e) => set(i, { name: e.target.value })} /></span>
              <span role="cell"><input aria-label={L("Quantity", "الكمية")} inputMode="decimal" value={l.qty} onChange={(e) => set(i, { qty: e.target.value.replace(/[^\d.]/g, "") })} className={l.qty ? "" : "is-missing"} placeholder="—" /></span>
              <span role="cell">
                <select aria-label={L("Unit", "الوحدة")} value={l.unit} onChange={(e) => set(i, { unit: e.target.value })}>
                  {UNITS.map((u) => <option key={u.v} value={u.v}>{isAr ? u.ar : u.en}</option>)}
                </select>
              </span>
              <span role="cell"><button type="button" className="boq-x" aria-label={L("Remove line", "حذف البند")} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><Trash2 size={16} aria-hidden /></button></span>
            </div>
          ))}
        </div>
        {lines.some((l) => !l.qty) ? <p className="boq-hint">{L("Lines without a quantity are sent as “quantity to confirm”.", "البنود بدون كمية تنرسل «الكمية تُحدد لاحقاً».")}</p> : null}
        {error ? <p className="boq-error" role="alert">{error}</p> : null}
        <button type="button" className="boq-go" onClick={continueToRequest}>
          {L(`Continue with ${lines.length} items`, `تابع بـ ${lines.length} بند`)}
        </button>
        <p className="boq-hint">{L("Next you choose the delivery city and date, then send it as one request.", "بعدها تختار مدينة التوصيل والموعد، وترسلها طلباً واحداً.")}</p>
      </div>
    );
  }

  return (
    <div className="boq-start">
      <label
        className={`boq-drop${drag ? " is-drag" : ""}${busy ? " is-busy" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void onFile(e.dataTransfer.files?.[0]); }}
      >
        <input ref={input} type="file" accept=".xlsx,.csv,.tsv,.txt" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
        <span className="boq-drop__icon" aria-hidden><Upload size={24} /></span>
        <b>{busy ? L("Reading your file…", "نقرأ ملفك…") : L("Drop your BOQ here or choose a file", "اسحب جدول الكميات هنا أو اختر ملفاً")}</b>
        <span>{L("Excel (.xlsx) or CSV, up to 8 MB. Read on your device, nothing is uploaded until you send.", "Excel ‏(xlsx) أو CSV حتى 8 ميجا. يُقرأ على جهازك وما يُرفع شي قبل الإرسال.")}</span>
      </label>
      {error ? <p className="boq-error" role="alert">{error}</p> : null}
      <div className="boq-or"><span>{L("or paste from your spreadsheet", "أو الصق من جدولك")}</span></div>
      <textarea
        className="boq-paste"
        rows={4}
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
        placeholder={L("Copy the rows in Excel and paste here", "انسخ الصفوف من Excel والصقها هنا")}
      />
      <div className="boq-start__foot">
        <button type="button" className="boq-go boq-go--sm" disabled={!paste.trim()} onClick={() => load(paste.split(/\r?\n/).map((r) => r.split("\t")), L("Pasted list", "قائمة ملصوقة"))}>
          {L("Read the pasted rows", "اقرأ الصفوف الملصوقة")}
        </button>
        <a className="boq-link" href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`} download="hukum-boq-template.csv">
          {L("Download a template", "حمّل نموذجاً")}
        </a>
      </div>
    </div>
  );
}
