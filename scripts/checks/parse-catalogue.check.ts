import assert from "node:assert/strict";
import { parseCatalogue } from "../../src/lib/parse-catalogue";
const { rows, columns } = parseCatalogue([
  ["Price list 2026"],
  ["Item code", "Product name", "Brand", "Unit price (SAR)", "UOM", "MOQ"],
  ["HLM-1", "Safety helmet", "RSS", "SAR 24.50", "pcs", "50"],
  ["GLV-2", "قفازات نتريل", "", "٦٫٧٥", "pairs", ""],
  ["", "", "", "", "", ""],
]);
assert.deepEqual(columns.sort(), ["brand", "moq", "name_en", "price", "sku", "unit"].sort());
assert.equal(rows.length, 2);
assert.deepEqual(rows[0], { name_en: "Safety helmet", name_ar: "", sku: "HLM-1", brand: "RSS", price: "24.50", unit: "piece", moq: "50", description_en: "" });
assert.equal(rows[1].name_ar, "قفازات نتريل");
assert.equal(rows[1].name_en, "");
assert.equal(rows[1].unit, "pair");
assert.equal(rows[1].price, "6.75");
assert.equal(parseCatalogue([["a", "b"], ["1", "2"]]).rows.length, 0, "no header → nothing guessed");
console.log("parse-catalogue ok");
