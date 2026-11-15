const fs = require("fs");
const p = "scripts/full-demo-catalog.ts";
let s = fs.readFileSync(p, "utf8");
const map = {
  bag: "carton",
  project: "custom",
  job: "custom",
  campaign: "custom",
  engagement: "custom",
  case: "custom",
  month: "custom",
  day: "custom",
  request: "custom",
  package: "custom",
  bundle: "pack",
  drum: "carton",
};
for (const [a, b] of Object.entries(map)) {
  s = s.split(`unit: "${a}"`).join(`unit: "${b}"`);
}
fs.writeFileSync(p, s);
console.log("units remapped");
