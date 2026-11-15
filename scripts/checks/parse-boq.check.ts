// Run: npx tsx scripts/checks/parse-boq.check.ts
import assert from "node:assert/strict";
import { parseBoqRows } from "../../src/lib/parse-boq";

const withHeader = [["Project: Site A"], ["No.", "Description", "Unit", "Qty", "Rate"], ["1", "Safety helmet white", "pcs", "500", ""], ["2", "Cement 50kg", "bags", "1,200", ""], ["", "Total", "", "", ""]];
assert.deepEqual(parseBoqRows(withHeader), [
  { name: "Safety helmet white", qty: "500", unit: "piece" },
  { name: "Cement 50kg", qty: "1200", unit: "bag" },
]);
const arabic = [["البند", "الكمية", "الوحدة"], ["قفازات نتريل", "٣٠٠", "زوج"]];
assert.deepEqual(parseBoqRows(arabic), [{ name: "قفازات نتريل", qty: "300", unit: "pair" }]);
const bare = [["Hi-vis vest", "200"], ["Stretch film roll", "20"]];
assert.deepEqual(parseBoqRows(bare), [{ name: "Hi-vis vest", qty: "200", unit: "" }, { name: "Stretch film roll", qty: "20", unit: "" }]);
assert.deepEqual(parseBoqRows([]), []);
assert.equal(parseBoqRows([["Item No", "Description", "Qty"], ["1", "Gloves", "5"]])[0].name, "Gloves", "description beats item number");
console.log("parse-boq ok");
