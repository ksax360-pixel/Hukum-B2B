const fs = require("fs");
const globalsPath = "src/app/globals.css";
const redesign = fs.readFileSync("src/styles/pdp-redesign.css", "utf8").trim() + "\n\n";
let s = fs.readFileSync(globalsPath, "utf8");
const start = s.indexOf("/* ========== PDP redesign extras ========== */");
const end = s.indexOf(".kt-gallery__placeholder {", start);
if (start < 0 || end < 0) {
  console.error("markers missing", start, end);
  process.exit(1);
}
s = s.slice(0, start) + redesign + s.slice(end);
fs.writeFileSync(globalsPath, s);
console.log("synced pdp redesign into globals.css");
