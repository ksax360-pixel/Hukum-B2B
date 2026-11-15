const fs = require("fs");
const path = require("path");

const dir = path.join("public", "products");
const vdir = path.join("public", "vendors");
fs.mkdirSync(dir, { recursive: true });
fs.mkdirSync(vdir, { recursive: true });

function svg({ bg, accent, title, shape }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="none">
  <rect width="800" height="600" fill="${bg}"/>
  <rect x="40" y="40" width="720" height="520" rx="28" fill="#ffffff" fill-opacity="0.55"/>
  ${shape}
  <text x="400" y="548" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="18" fill="#001730" fill-opacity="0.45">${title}</text>
</svg>`;
}

const shapes = {
  helmet: `<ellipse cx="400" cy="360" rx="150" ry="40" fill="#001730" opacity="0.08"/>
    <path d="M250 340c10-120 290-120 300 0v20H250v-20z" fill="#D21F1F"/>
    <path d="M270 340c12-90 248-90 260 0" stroke="#8B1212" stroke-width="10" fill="none"/>
    <rect x="232" y="348" width="336" height="22" rx="8" fill="#1A1A1A"/>`,
  cement: `<rect x="300" y="180" width="200" height="260" rx="12" fill="#C4B5A0"/>
    <rect x="300" y="180" width="200" height="70" fill="#8B7355"/>
    <text x="400" y="320" text-anchor="middle" font-size="22" font-weight="700" fill="#5C4A32">OPC 42.5</text>`,
  coffee: `<ellipse cx="400" cy="400" rx="130" ry="36" fill="#3F2A1D"/>
    <path d="M300 250c0-40 200-40 200 0v150c0 40-200 40-200 0V250z" fill="#6B3F24"/>
    <circle cx="360" cy="300" r="18" fill="#2A1810"/><circle cx="420" cy="330" r="16" fill="#2A1810"/><circle cx="390" cy="360" r="14" fill="#2A1810"/>`,
  medical: `<rect x="310" y="170" width="180" height="280" rx="20" fill="#E8F4FA"/>
    <rect x="370" y="210" width="60" height="200" rx="8" fill="#0EA5E9"/>
    <rect x="330" y="270" width="140" height="60" rx="8" fill="#0284C7"/>
    <circle cx="400" cy="200" r="28" fill="#D21F1F"/>`,
  fabric: `<rect x="220" y="160" width="360" height="280" rx="8" fill="#BE185D"/>
    <path d="M220 200h360M220 240h360M220 280h360M220 320h360M220 360h360" stroke="#fff" stroke-opacity="0.25" stroke-width="6"/>
    <rect x="500" y="150" width="90" height="300" rx="8" fill="#9F1239"/>`,
  cable: `<path d="M180 300c80-120 140 120 230 0s150 120 240 0" stroke="#F59E0B" stroke-width="28" fill="none" stroke-linecap="round"/>
    <circle cx="180" cy="300" r="22" fill="#001730"/><circle cx="650" cy="300" r="22" fill="#001730"/>`,
  hvac: `<rect x="230" y="190" width="340" height="220" rx="16" fill="#E2E8F0"/>
    <circle cx="400" cy="300" r="70" fill="#94A3B8"/>
    <circle cx="400" cy="300" r="28" fill="#0F172A"/>
    <rect x="250" y="210" width="80" height="14" rx="4" fill="#64748B"/>`,
  carton: `<path d="M280 220h240l40 40v200H240V260l40-40z" fill="#D6B17A"/>
    <path d="M280 220l40 40h240v-40" fill="#C49A62"/>
    <path d="M520 260v200l40-40V260l-40-40" fill="#B8894E"/>`,
  drip: `<path d="M400 160c80 110 140 160 140 230a140 140 0 1 1-280 0c0-70 60-120 140-230z" fill="#0EA5E9" opacity="0.85"/>
    <circle cx="400" cy="390" r="36" fill="#0369A1"/>`,
  coverall: `<path d="M340 160h120l20 40v40h60v220h-80v-100h-40v100h-80V240h60v-40l20-40z" fill="#F59E0B"/>
    <rect x="360" y="210" width="80" height="18" fill="#001730"/>`,
  pump: `<rect x="250" y="260" width="300" height="140" rx="16" fill="#0F766E"/>
    <circle cx="320" cy="330" r="46" fill="#134E4A"/>
    <rect x="480" y="200" width="50" height="160" rx="8" fill="#115E59"/>
    <rect x="220" y="300" width="50" height="40" rx="6" fill="#99F6E4"/>`,
  print: `<rect x="240" y="200" width="320" height="200" rx="12" fill="#334155"/>
    <rect x="270" y="230" width="260" height="90" fill="#F8FAFC"/>
    <rect x="270" y="340" width="120" height="28" rx="4" fill="#D21F1F"/>`,
  stationery: `<rect x="250" y="180" width="180" height="240" rx="8" fill="#FFFFFF" stroke="#001730" stroke-width="3"/>
    <rect x="450" y="210" width="110" height="180" rx="8" fill="#D21F1F"/>
    <rect x="300" y="200" width="90" height="12" fill="#CBD5E1"/>`,
  toner: `<rect x="300" y="200" width="200" height="220" rx="16" fill="#111827"/>
    <rect x="320" y="230" width="160" height="40" rx="6" fill="#D21F1F"/>
    <rect x="340" y="300" width="120" height="80" fill="#1F2937"/>`,
  solar: `<rect x="220" y="180" width="360" height="220" rx="8" fill="#1E3A8A"/>
    <path d="M220 253h360M220 326h360M340 180v220M460 180v220" stroke="#93C5FD" stroke-width="6"/>`,
  service: `<circle cx="400" cy="280" r="90" fill="#001730"/>
    <path d="M400 220v120M340 280h120" stroke="#C9A962" stroke-width="14" stroke-linecap="round"/>
    <rect x="300" y="390" width="200" height="18" rx="9" fill="#C9A962"/>`,
  default: `<rect x="280" y="190" width="240" height="240" rx="24" fill="#001730"/>
    <path d="M330 360l70-90 40 50 30-30 50 70H330z" fill="#D21F1F"/>`,
};

const products = [
  ["helmet", "#F4E8E8", "Safety helmet"],
  ["cement", "#F3EEE6", "Portland cement"],
  ["coffee", "#F4EDE6", "Coffee beans"],
  ["medical", "#EAF4F8", "Medical equipment"],
  ["fabric", "#F8EAF1", "Textile roll"],
  ["cable", "#FFF7E8", "Power cable"],
  ["hvac", "#EEF3F8", "HVAC unit"],
  ["carton", "#F6F0E6", "Shipping carton"],
  ["drip", "#E8F6FB", "Irrigation kit"],
  ["coverall", "#FFF6E5", "FR coverall"],
  ["pump", "#E6F4F2", "Industrial pump"],
  ["print", "#F1F5F9", "Print package"],
  ["stationery", "#F7F8F9", "Stationery kit"],
  ["toner", "#F1F5F9", "Toner bundle"],
  ["solar", "#EEF2FF", "Solar panel"],
  ["service", "#F4F1EA", "Professional service"],
  ["default", "#EEF3F7", "Kingdom Trade product"],
];

for (const [key, bg, title] of products) {
  fs.writeFileSync(path.join(dir, `${key}.svg`), svg({ bg, accent: "#D21F1F", title, shape: shapes[key] || shapes.default }));
}

function vendorMark(letter, color, name) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" rx="48" fill="${color}"/>
  <text x="200" y="230" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial" font-size="140" font-weight="700" fill="#ffffff">${letter}</text>
</svg>`;
}

fs.writeFileSync(path.join(vdir, "rss.svg"), vendorMark("R", "#001730", "RSS"));
fs.writeFileSync(path.join(vdir, "najd.svg"), vendorMark("N", "#8B1E3F", "Najd"));
fs.writeFileSync(path.join(vdir, "eastern.svg"), vendorMark("E", "#0F766E", "Eastern"));
fs.writeFileSync(path.join(vdir, "demo.svg"), vendorMark("D", "#D21F1F", "Demo"));

console.log("Wrote product and vendor visuals");
