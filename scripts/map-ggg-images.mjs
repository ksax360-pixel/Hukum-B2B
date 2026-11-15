import fs from "fs";
import path from "path";
import os from "os";
import sharp from "sharp";

const srcDir = path.join("public", "ggg");
const outDir = path.join("public", "images", "categories");
const legacyDir = path.join("public", "categories");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hukum-ggg-"));

/** Source UUID → sector slug (matched by inspecting each photo). */
const mapping = [
  ["1b3a9050-101e-4086-a431-5b3e116262f5", "kitchen-equipment"],
  ["1b742d18-b6b5-4e81-8ff4-2992e3a36830", "cold-chain"],
  ["206fa50b-08b0-404b-9599-290f06f2371b", "hospitality-cafes"],
  ["33060614-1407-46e1-85c8-ec02ffa12698", "signage-barriers"],
  ["58cd4dce-8189-444e-bec7-9ddd4c590bf5", "grains-staples"],
  ["59c62cfd-a6b8-4268-ac5d-8903a05b6265", "eye-protection"],
  ["635d4c6d-1383-471d-a9a9-11d99af69aa4", "medical-supplies"],
  ["677d6eef-8475-4164-9367-253e262a4701", "food-beverage"],
  ["86dae305-33f6-4243-b17d-ac43968f03d3", "lab-scientific"],
  ["9282373b-15ee-4a83-a4be-70002da51551", "cleaning-hygiene"],
  ["9cb0f75e-5d7e-43f5-93c3-71123df33c02", "confectionery"],
  ["a1d92ff8-56bc-4bf8-a0ba-55651f17246b", "fresh-produce"],
  ["a2c5f4b7-1fec-4d46-b605-af3170efc686", "security-systems"],
  ["a34796a2-b26e-44d9-8472-d6789c5b90c5", "pharmaceuticals"],
  ["af25fe7a-02ce-42ae-9f54-dc035d36a0e7", "beverages"],
  ["c28f790d-06fb-4d56-911b-f2d822d9bc3e", "workwear-uniforms"],
  ["de771876-6d68-49d5-a7ec-79da7a29c99d", "fire-safety"],
];

/** Refresh homepage BrowseBySector assets where they overlap. */
const homepageAliases = {
  "food-beverage": ["food-beverage"],
  "medical-supplies": ["medical-supplies"],
  "lab-scientific": ["lab-scientific"],
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
fs.mkdirSync(legacyDir, { recursive: true });

const report = [];
for (const [id, slug] of mapping) {
  const src = path.join(srcDir, `${id}.png`);
  if (!fs.existsSync(src)) {
    report.push(`${slug}: MISSING ${id}`);
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

  // Palette can drop alpha; re-export RGBA if needed and still oversized.
  let meta = await sharp(tp).metadata();
  if (!meta.hasAlpha) {
    await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .resize(900, 900, { fit: "inside" })
      .png({ compressionLevel: 9 })
      .toFile(tp);
    pngSize = fs.statSync(tp).size;
    meta = await sharp(tp).metadata();
  }

  fs.copyFileSync(tp, path.join(outDir, `${slug}.png`));
  fs.copyFileSync(tw, path.join(outDir, `${slug}.webp`));

  for (const alias of homepageAliases[slug] || []) {
    fs.copyFileSync(tp, path.join(legacyDir, `${alias}.png`));
  }

  report.push(
    `${slug.padEnd(24)} alpha=${meta.hasAlpha} clear=${ratio} png=${Math.round(pngSize / 1024)}kb webp=${Math.round(fs.statSync(tw).size / 1024)}kb`
  );
}

console.log(report.join("\n"));
console.log(`\nMapped ${mapping.length} ggg images → ${outDir}`);
