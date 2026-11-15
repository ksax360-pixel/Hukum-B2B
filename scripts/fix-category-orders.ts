import fs from "fs";

const p = "src/data/marketplace-categories.ts";
let s = fs.readFileSync(p, "utf8");

const bumps: Array<[string, number]> = [
  ["marketing-services", 41],
  ["company-formation", 42],
  ["legal-services", 43],
  ["visa-services", 44],
  ["accounting-finance", 45],
  ["hr-recruitment", 46],
  ["translation-services", 47],
  ["professional-services", 48],
  ["others", 99],
];

for (const [key, order] of bumps) {
  const re = new RegExp(`(key: "${key}"[\\s\\S]*?order: )\\d+`);
  if (!re.test(s)) {
    console.warn("miss", key);
    continue;
  }
  s = s.replace(re, `$1${order}`);
}

fs.writeFileSync(p, s);
console.log("service orders updated");
