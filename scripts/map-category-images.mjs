import fs from "fs";
import path from "path";
import os from "os";
import sharp from "sharp";

const srcDir = path.join("public", "images category");
const outDir = path.join("public", "images", "categories");
const legacyDir = path.join("public", "categories");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hukum-map-"));

/** Source file number → sector slug (matched by inspecting each photo). */
const mapping = [
  [1, "plumbing-sanitary"],
  [2, "construction-services"],
  [3, "renewable-energy"],
  [4, "instruments-testing"],
  [5, "industrial-machinery"],
  [6, "spare-parts"],
  [7, "paints-coatings"],
  [8, "hand-protection"],
  [9, "building-materials"],
  [10, "steel-rebar"],
  [11, "oil-gas-equipment"],
  [12, "safety-equipment"],
  [13, "safety-footwear"],
  [14, "electrical"],
  [15, "tools-hardware"],
  [16, "doors-windows"],
  [17, "lighting"],
  [18, "hvac-refrigeration"],
  [19, "cables-wires"],
];

/** Also refresh homepage legacy filenames where they overlap. */
const homepageAliases = {
  "building-materials": ["building-materials"],
  electrical: ["electrical"],
  "safety-equipment": ["safety-equipment"],
  "oil-gas-equipment": ["oil-gas"],
  "tools-hardware": ["tools-hardware"],
  "lab-scientific": [],
};

function colorDist(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function floodAlpha(data, w, h, threshold = 55) {
  const visited = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    visited[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  const bg = [data[0], data[1], data[2]];
  while (stack.length) {
    const i = stack.pop();
    const p = i * 4;
    if (colorDist([data[p], data[p + 1], data[p + 2]], bg) > threshold) continue;
    data[p + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    if (data[p + 3] === 0) continue;
    const lum = (data[p] + data[p + 1] + data[p + 2]) / 3;
    if (lum < 18) data[p + 3] = 0;
  }
}

const report = [];
for (const [n, slug] of mapping) {
  const src = path.join(srcDir, `hukum (${n}).png`);
  if (!fs.existsSync(src)) {
    report.push(`${slug}: MISSING ${n}`);
    continue;
  }

  const { data, info } = await sharp(src)
    .ensureAlpha()
    .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.from(data);
  floodAlpha(rgba, info.width, info.height, 55);

  let transparent = 0;
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] === 0) transparent++;
  const ratio = (transparent / (info.width * info.height)).toFixed(2);

  const tp = path.join(tmp, `${slug}.png`);
  const tw = path.join(tmp, `${slug}.webp`);

  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(tp);

  let q = 78;
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: q, alphaQuality: 92 })
    .toFile(tw);
  while (fs.statSync(tw).size > 200 * 1024 && q > 42) {
    q -= 6;
    await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .webp({ quality: q, alphaQuality: 88 })
      .toFile(tw);
  }

  let pngSize = fs.statSync(tp).size;
  if (pngSize > 280 * 1024) {
    await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .resize(900, 900, { fit: "inside" })
      .png({ palette: true, quality: 82, compressionLevel: 9, colours: 220 })
      .toFile(tp);
    pngSize = fs.statSync(tp).size;
  }

  fs.copyFileSync(tp, path.join(outDir, `${slug}.png`));
  fs.copyFileSync(tw, path.join(outDir, `${slug}.webp`));

  // Keep homepage BrowseBySector assets in sync for overlapping popular sectors.
  for (const alias of homepageAliases[slug] || []) {
    fs.copyFileSync(tp, path.join(legacyDir, `${alias}.png`));
  }

  const meta = await sharp(path.join(outDir, `${slug}.png`)).metadata();
  report.push(
    `${String(n).padStart(2)} → ${slug.padEnd(24)} alpha=${meta.hasAlpha} clear=${ratio} png=${Math.round(pngSize / 1024)}kb webp=${Math.round(fs.statSync(tw).size / 1024)}kb`
  );
}

console.log(report.join("\n"));
