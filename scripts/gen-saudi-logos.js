const fs = require("fs");
const path = require("path");

const dir = path.join("public", "logos");
fs.mkdirSync(dir, { recursive: true });

const logos = [
  ["aramco", "ARAMCO", "#00A3E0"],
  ["sabic", "SABIC", "#7AC143"],
  ["stc", "stc", "#4F008C"],
  ["alrajhi", "Al Rajhi", "#00843D"],
  ["almarai", "Almarai", "#E30613"],
  ["maaden", "Maaden", "#0B3D2E"],
  ["neom", "NEOM", "#111111"],
  ["acwa", "ACWA", "#00AEEF"],
  ["saudia", "Saudia", "#006341"],
  ["mobily", "mobily", "#6B2D8B"],
  ["sec", "SEC", "#F36C21"],
  ["bahri", "Bahri", "#003DA5"],
  ["savola", "Savola", "#8B1E3F"],
  ["jarir", "Jarir", "#E31C23"],
  ["riyad", "Riyad Bank", "#006B3F"],
  ["elm", "Elm", "#1B4F72"],
  ["tasnee", "TASNEE", "#C8102E"],
  ["sipchem", "Sipchem", "#0055A5"],
  ["alinma", "Alinma", "#8DC63F"],
  ["extra", "eXtra", "#E30613"],
];

for (const [id, label, color] of logos) {
  const initial = label.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase();
  const safe = label.replace(/&/g, "&amp;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="72" viewBox="0 0 220 72" fill="none">
  <rect width="220" height="72" rx="14" fill="#ffffff"/>
  <rect x="14" y="18" width="36" height="36" rx="10" fill="${color}"/>
  <text x="32" y="42" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="16" font-weight="700" fill="#ffffff">${initial}</text>
  <text x="62" y="43" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="#001730" letter-spacing="-0.3">${safe}</text>
</svg>`;
  fs.writeFileSync(path.join(dir, `${id}.svg`), svg);
}

console.log(`wrote ${logos.length} logos`);
