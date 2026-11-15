import { MARKETPLACE_CATEGORIES } from "../src/data/marketplace-categories";

console.log("total", MARKETPLACE_CATEGORIES.length);
for (const k of ["stationery", "printing-services", "packaging", "office-supplies"]) {
  const c = MARKETPLACE_CATEGORIES.find((x) => x.key === k);
  console.log(k, c ? `${c.name.en} | children=${c.children?.length || 0}` : "MISSING");
}
