// Client-side: read the first sheet of an .xlsx or a .csv into rows of cells. Libraries load on demand.

export async function readRows(file: File): Promise<unknown[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];
    const rows: unknown[][] = [];
    ws?.eachRow({ includeEmpty: false }, (row) => {
      const vals = (row.values as unknown[]).slice(1).map((v) => (v && typeof v === "object" && "result" in v ? (v as { result: unknown }).result : v && typeof v === "object" && "text" in v ? (v as { text: unknown }).text : v));
      rows.push(vals);
    });
    return rows;
  }
  if (name.endsWith(".xls")) throw new Error("xls");
  const Papa = (await import("papaparse")).default;
  const text = await file.text();
  return Papa.parse<string[]>(text, { skipEmptyLines: true }).data;
}
