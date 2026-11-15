import fs from "fs";
import path from "path";

const BASE = "http://127.0.0.1:3000";
const imgDir = "public/images/categories";

function parseSectorSlugs() {
  const src = fs.readFileSync("src/data/marketplace-sectors.ts", "utf8");
  const groups = [];
  let current = null;
  for (const line of src.split(/\r?\n/)) {
    const g = line.match(/id:\s*"([^"]+)"/);
    if (g && line.includes("id:")) {
      // only top-level group ids appear before sectors blocks; keep simple
    }
    const m = line.match(/^\s*slug:\s*"([^"]+)"/);
    if (m) {
      // skip child slugs that appear under children arrays by tracking depth roughly via indent
      const indent = line.match(/^\s*/)[0].length;
      if (indent <= 10) {
        groups.push(m[1]);
      }
    }
  }
  // Prefer unique parent-level: marketplace sectors are indented with 8 spaces typically
  const all = [...src.matchAll(/^\s{8}slug:\s*"([^"]+)"/gm)].map((m) => m[1]);
  return [...new Set(all.length ? all : [...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]))];
}

async function fetchPage(url, { method = "GET" } = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { method, redirect: "manual" });
    const text = method === "HEAD" ? "" : await res.text();
    const wanted = [
      "content-security-policy",
      "x-frame-options",
      "x-content-type-options",
      "referrer-policy",
      "strict-transport-security",
      "permissions-policy",
    ];
    const headers = {};
    for (const k of wanted) {
      const v = res.headers.get(k);
      if (v) headers[k] = v;
    }
    return {
      url,
      status: res.status,
      ms: Date.now() - t0,
      location: res.headers.get("location"),
      contentType: res.headers.get("content-type") || "",
      len: text.length,
      text,
      headers,
    };
  } catch (e) {
    return {
      url,
      status: 0,
      ms: Date.now() - t0,
      error: String(e.message || e),
      text: "",
      len: 0,
      headers: {},
      contentType: "",
    };
  }
}

function analyzeHtml(html, route) {
  const issues = [];
  if (!html) return { issues, title: null, desc: null, imgs: 0 };

  if (/Module not found|Can't resolve|Application error|Unhandled Runtime Error/i.test(html)) {
    issues.push({
      severity: "critical",
      route,
      kind: "runtime",
      detail: "Error / module failure rendered in HTML",
    });
  }
  if (route.includes("/categories") && /hukum-sector-card__name-ar/.test(html)) {
    issues.push({
      severity: "medium",
      route,
      kind: "ui",
      detail: "Arabic subtitle markup still present on category cards",
    });
  }

  const missingAlt = (html.match(/<img(?![^>]*\balt=)/gi) || []).length;
  if (missingAlt > 0) {
    issues.push({
      severity: "low",
      route,
      kind: "a11y",
      detail: `${missingAlt} img tags without alt`,
    });
  }

  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1 === 0) {
    issues.push({ severity: "medium", route, kind: "seo", detail: "No h1 found" });
  } else if (h1 > 1) {
    issues.push({ severity: "low", route, kind: "seo", detail: `${h1} h1 tags` });
  }

  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || null;
  if (!title) {
    issues.push({ severity: "high", route, kind: "seo", detail: "Missing title" });
  } else if (title.length > 70) {
    issues.push({
      severity: "low",
      route,
      kind: "seo",
      detail: `Title long (${title.length} chars)`,
    });
  }

  const desc = (html.match(/name=["']description["'] content=["']([^"']*)["']/i) || [])[1] || null;
  if (!desc) {
    issues.push({ severity: "medium", route, kind: "seo", detail: "Missing meta description" });
  }

  if (!/rel=["']canonical["']/i.test(html)) {
    issues.push({ severity: "medium", route, kind: "seo", detail: "Missing canonical link" });
  }
  if (!/property=["']og:image["']/i.test(html)) {
    issues.push({ severity: "low", route, kind: "seo", detail: "Missing og:image" });
  }

  // Language inconsistency cues on EN pages
  if (route.startsWith("/en") && /dir=["']rtl["']/i.test(html) && !/lang=["']ar["']/i.test(html.slice(0, 500))) {
    // soft signal only
  }

  const imgs = (html.match(/<img\b/gi) || []).length;
  return { issues, title, desc, imgs };
}

const routes = [
  "/en",
  "/ar",
  "/en/categories",
  "/ar/categories",
  "/en/categories/safety-equipment",
  "/en/categories/food-beverage",
  "/en/categories/automotive-parts",
  "/en/categories/agriculture",
  "/en/categories/does-not-exist-xyz",
  "/en/suppliers",
  "/en/manufacturers",
  "/en/products",
  "/en/about",
  "/en/contact",
  "/en/faq",
  "/en/how-it-works",
  "/en/verification-levels",
  "/en/request-quotes",
  "/en/concierge",
  "/en/help",
  "/en/report",
  "/en/terms",
  "/en/privacy",
  "/en/marketplace-rules",
  "/en/vendors",
  "/en/become-a-vendor",
  "/en/whatsapp",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/site.webmanifest",
  "/favicon.ico",
  "/favicon.png",
  "/brand/hukum-favicon.png",
  "/brand/apple-touch-icon.png",
  "/og/hukum-share.jpg",
];

const sectorSlugs = parseSectorSlugs();
const results = [];
const allIssues = [];
const statusSummary = { ok: 0, redirect: 0, client: 0, server: 0, fail: 0 };

for (const route of routes) {
  const r = await fetchPage(BASE + route);
  const row = {
    route,
    status: r.status,
    ms: r.ms,
    len: r.len,
    location: r.location,
    contentType: r.contentType,
    headers: r.headers,
    error: r.error || null,
  };

  if (r.status >= 200 && r.status < 300) statusSummary.ok++;
  else if (r.status >= 300 && r.status < 400) statusSummary.redirect++;
  else if (r.status >= 400 && r.status < 500) statusSummary.client++;
  else if (r.status >= 500) statusSummary.server++;
  else statusSummary.fail++;

  if (r.contentType.includes("text/html") && r.text) {
    const parsed = analyzeHtml(r.text, route);
    allIssues.push(...parsed.issues);
    row.title = parsed.title;
    row.descLen = parsed.desc ? parsed.desc.length : 0;
    row.imgs = parsed.imgs;
  }

  // expected 404 for fake slug
  if (route.includes("does-not-exist") && r.status !== 404) {
    allIssues.push({
      severity: "medium",
      route,
      kind: "routing",
      detail: `Expected 404 for unknown category, got ${r.status}`,
    });
  }

  results.push(row);
}

const sectorCoverage = sectorSlugs.map((slug) => {
  const webpPath = path.join(imgDir, `${slug}.webp`);
  const pngPath = path.join(imgDir, `${slug}.png`);
  const webp = fs.existsSync(webpPath);
  const png = fs.existsSync(pngPath);
  return {
    slug,
    webp,
    png,
    webpKb: webp ? Math.round(fs.statSync(webpPath).size / 1024) : 0,
    pngKb: png ? Math.round(fs.statSync(pngPath).size / 1024) : 0,
  };
});

const missingImages = sectorCoverage.filter((s) => !s.webp && !s.png).map((s) => s.slug);
const oversizedWebp = sectorCoverage
  .filter((s) => s.webpKb > 200)
  .map((s) => ({ slug: s.slug, kb: s.webpKb }));
const oversizedPng = sectorCoverage
  .filter((s) => s.pngKb > 300)
  .map((s) => ({ slug: s.slug, kb: s.pngKb }));

const cat = await fetchPage(BASE + "/en/categories");
const catImgs = [...(cat.text.matchAll(/src="(\/images\/categories\/[^"]+)"/g) || [])].map((m) => m[1]);
const uniqueCatImgs = [...new Set(catImgs)];
const brokenCatImgs = [];
for (const src of uniqueCatImgs) {
  const g = await fetchPage(BASE + src);
  if (!(g.status >= 200 && g.status < 400)) brokenCatImgs.push({ src, status: g.status });
}

const homePage = await fetchPage(BASE + "/en");
const homeSectorImgs = [...(homePage.text.matchAll(/src="(\/categories\/[^"]+)"/g) || [])].map((m) => m[1]);
const brokenHomeImgs = [];
for (const src of [...new Set(homeSectorImgs)]) {
  const g = await fetchPage(BASE + src);
  if (!(g.status >= 200 && g.status < 400)) brokenHomeImgs.push({ src, status: g.status });
}

// Favicon / brand assets existence
const assetChecks = [
  "public/favicon.ico",
  "public/favicon.png",
  "public/favicon.svg",
  "public/brand/hukum-favicon.png",
  "public/brand/apple-touch-icon.png",
  "public/og/hukum-share.jpg",
  "public/site.webmanifest",
];
const missingPublicAssets = assetChecks.filter((p) => !fs.existsSync(p));

const home = results.find((r) => r.route === "/en");
const requiredSecurity = [
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
];
for (const h of requiredSecurity) {
  if (!home?.headers?.[h]) {
    allIssues.push({
      severity: "medium",
      route: "/en",
      kind: "security",
      detail: `Missing response header: ${h}`,
    });
  }
}

for (const img of brokenCatImgs) {
  allIssues.push({
    severity: "high",
    route: "/en/categories",
    kind: "asset",
    detail: `Broken category image ${img.src} (${img.status})`,
  });
}
for (const img of brokenHomeImgs) {
  allIssues.push({
    severity: "high",
    route: "/en",
    kind: "asset",
    detail: `Broken homepage sector image ${img.src} (${img.status})`,
  });
}
for (const slug of missingImages) {
  allIssues.push({
    severity: "medium",
    route: "/en/categories",
    kind: "asset",
    detail: `Missing sector cutout for ${slug}`,
  });
}
for (const p of missingPublicAssets) {
  allIssues.push({
    severity: "medium",
    route: "public",
    kind: "asset",
    detail: `Missing file ${p}`,
  });
}

const nonOk = results.filter((r) => {
  if (r.route.includes("does-not-exist")) return r.status !== 404;
  return !(r.status >= 200 && r.status < 300);
});

const report = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  statusSummary,
  sectorCount: sectorSlugs.length,
  sectorCoverage: {
    total: sectorCoverage.length,
    withWebp: sectorCoverage.filter((s) => s.webp).length,
    withPng: sectorCoverage.filter((s) => s.png).length,
    missing: missingImages,
    oversizedWebp,
    oversizedPng,
  },
  categoryImagesOnPage: {
    totalRefs: catImgs.length,
    unique: uniqueCatImgs.length,
    broken: brokenCatImgs,
  },
  homepageSectorImages: {
    total: homeSectorImgs.length,
    unique: [...new Set(homeSectorImgs)].length,
    broken: brokenHomeImgs,
  },
  securityHeadersOnEn: home?.headers || {},
  missingPublicAssets,
  routes: results,
  issues: allIssues.sort((a, b) => {
    const rank = { critical: 0, high: 1, medium: 2, low: 3 };
    return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9);
  }),
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/live-audit-report.json", JSON.stringify(report, null, 2));

const bySeverity = Object.fromEntries(
  ["critical", "high", "medium", "low"].map((s) => [s, allIssues.filter((i) => i.severity === s).length])
);

console.log(
  JSON.stringify(
    {
      statusSummary,
      issueCount: allIssues.length,
      bySeverity,
      sectorCount: sectorSlugs.length,
      missingImages,
      oversizedWebp,
      oversizedPng: oversizedPng.slice(0, 15),
      brokenCatImgs,
      brokenHomeImgs,
      missingPublicAssets,
      nonOkRoutes: nonOk.map((r) => ({
        route: r.route,
        status: r.status,
        location: r.location,
        error: r.error,
      })),
      securityHeadersOnEn: home?.headers || {},
      slowRoutes: results
        .filter((r) => r.ms > 2500)
        .map((r) => ({ route: r.route, ms: r.ms, status: r.status })),
      topIssues: allIssues.slice(0, 40),
    },
    null,
    2
  )
);
