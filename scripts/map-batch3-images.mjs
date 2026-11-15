import fs from "fs";
import path from "path";
import os from "os";
import sharp from "sharp";

const assets = path.join(
  "C:/Users/91810/.cursor/projects/c-Users-91810-Documents-projets-Hukum-B2B-main/assets"
);
const outDir = path.join("public", "images", "categories");
const legacyDir = path.join("public", "categories");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hukum-batch3-"));

/** Uploaded asset → sector slug */
const mapping = [
  ["b107d3d2-d3f4-4474-9db1-5adce350cbf4-f81a1ae8-cb13-4b01-afeb-6af768b12a87.png", "cosmetics-personal-care"],
  ["31ec556e-5796-483f-a2e9-7ab5df5eb39c-530a56e9-7a16-486e-bdb2-33be88cc55ed.png", "office-stationery"],
  ["615cd4b5-1de0-44b7-8c04-115b26129a60-7a250200-c744-49a4-bdb6-22d825bc4303.png", "logistics"],
  ["62b734a3-d414-4b32-9e98-7a62eacdc958-51d103eb-452d-42a7-a476-c39870b11d48.png", "packaging"],
  ["04ee7c0a-ba68-4a00-98c5-0e88a232cfec-62bd59a9-92ed-457e-a07b-61a5991cf9c5.png", "medical-consumables"],
  ["e2284c5a-ea07-45d1-ac75-9d4b4b608ca3-6cdc724a-3fa4-48a4-b87b-b95e6381ba1d.png", "warehousing"],
  ["8b329d4f-44c7-47fb-a772-0d5ec7fef982-afa278b9-4d5c-4056-b8a2-04a896c37be4.png", "printing"],
];

const homepageAliases = {
  "office-stationery": ["stationery"],
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

fs.mkdirSync(outDir, { recursive: true });
const report = [];

for (const [file, slug] of mapping) {
  const src = path.join(assets, file);
  if (!fs.existsSync(src)) {
    report.push(`${slug}: MISSING`);
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

  let dim = 900;
  let pngSize = Infinity;
  let attempt = 0;
  while (pngSize > 240 * 1024 && attempt < 10) {
    await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .resize(dim, dim, { fit: "inside" })
      .png({ compressionLevel: 9 })
      .toFile(tp);
    pngSize = fs.statSync(tp).size;
    attempt++;
    dim = Math.max(560, dim - 40);
  }

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

  fs.copyFileSync(tp, path.join(outDir, `${slug}.png`));
  fs.copyFileSync(tw, path.join(outDir, `${slug}.webp`));

  for (const alias of homepageAliases[slug] || []) {
    fs.copyFileSync(tp, path.join(legacyDir, `${alias}.png`));
  }

  const meta = await sharp(tp).metadata();
  report.push(
    `${slug.padEnd(28)} alpha=${meta.hasAlpha} clear=${ratio} png=${Math.round(pngSize / 1024)}kb webp=${Math.round(fs.statSync(tw).size / 1024)}kb`
  );
}

console.log(report.join("\n"));
