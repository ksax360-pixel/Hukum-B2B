// Run: npx tsx scripts/checks/group-offers.check.ts
import assert from "node:assert/strict";
import { groupOffers, leadDays } from "../../src/components/browse/group-offers";

const p = (id: string, en: string, price?: number) => ({ _id: id, name: { en }, price });
const g = groupOffers([p("1", "Safety Helmet White", 44), p("2", "Gloves", 5), p("3", "safety helmet  white (Demo)", 38)]);
assert.equal(g.length, 2);
assert.deepEqual(g[0].offers.map((o) => o._id), ["3", "1"], "cheapest offer first");
assert.deepEqual(groupOffers([p("1", "A", 9), p("2", "B", 3)], "price").map((x) => x.key), ["b", "a"]);
assert.equal(leadDays("10–15 days"), 10);
assert.equal(leadDays("2 weeks"), 14);
assert.equal(leadDays(undefined), Infinity);
console.log("group-offers ok");
