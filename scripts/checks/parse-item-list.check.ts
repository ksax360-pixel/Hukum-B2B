// Run: npx tsx scripts/checks/parse-item-list.check.ts
import assert from "node:assert/strict";
import { parseItemList } from "../../src/lib/parse-item-list";

assert.deepEqual(parseItemList("500 pcs safety helmets"), [{ qty: "500", unit: "piece", name: "safety helmets" }]);
assert.deepEqual(parseItemList("Cement 50kg bags - 200 bags"), [{ name: "Cement 50kg bags", qty: "200", unit: "bag" }]);
assert.deepEqual(parseItemList("Nitrile gloves x 1,000"), [{ name: "Nitrile gloves", qty: "1000", unit: "" }]);
assert.deepEqual(parseItemList("٣٠٠ قفاز"), [{ qty: "300", unit: "", name: "قفاز" }]);
assert.deepEqual(parseItemList("Hi-vis vests"), [{ name: "Hi-vis vests", qty: "", unit: "" }]);
assert.equal(parseItemList("a\n\nb; c").length, 3);
assert.deepEqual(parseItemList("1. 20 rolls stretch film"), [{ qty: "20", unit: "roll", name: "stretch film" }]);
console.log("parse-item-list ok");
