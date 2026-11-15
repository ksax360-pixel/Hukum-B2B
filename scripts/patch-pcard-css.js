const fs = require("fs");
const p = "src/app/globals.css";
let s = fs.readFileSync(p, "utf8");
const start = s.indexOf(".kt-product-grid {");
const end = s.indexOf("/* PDP */", start);
if (start < 0 || end < 0) {
  console.error("markers", start, end);
  process.exit(1);
}
const next = `.kt-product-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
@media (min-width: 900px) {
  .kt-product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (min-width: 1280px) {
  .kt-product-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
}

.kt-pcard {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid rgba(0, 23, 48, 0.07);
  border-radius: 0.9rem;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.kt-pcard:hover {
  border-color: rgba(0, 23, 48, 0.14);
  box-shadow: 0 12px 28px rgba(0, 23, 48, 0.06);
  transform: translateY(-2px);
}
.kt-pcard__media {
  position: relative;
  display: block;
  aspect-ratio: 5 / 4;
  overflow: hidden;
  background: #f3f4f6;
}
.kt-pcard__img,
.kt-pcard__placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}
.kt-pcard:hover .kt-pcard__img { transform: scale(1.04); }
.kt-pcard__placeholder {
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(0, 23, 48, 0.28);
}
.kt-pcard__sector {
  position: absolute;
  top: 0.55rem;
  inset-inline-start: 0.55rem;
  max-width: calc(100% - 1.1rem);
  padding: 0.22rem 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 23, 48, 0.06);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #3d4f56;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kt-pcard__price-pill {
  position: absolute;
  left: 0.55rem;
  right: 0.55rem;
  bottom: 0.55rem;
  padding: 0.4rem 0.55rem;
  border-radius: 0.55rem;
  background: rgba(0, 23, 48, 0.82);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  backdrop-filter: blur(6px);
}
.kt-pcard__body {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  padding: 0.7rem 0.75rem 0.8rem;
  flex: 1;
}
.kt-pcard__brand {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8a969b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kt-pcard__title {
  font-size: 0.86rem;
  font-weight: 600;
  color: #001730;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.kt-pcard__vendor-line {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  margin-top: 0.15rem;
}
.kt-pcard__vendor-name {
  font-size: 0.72rem;
  font-weight: 500;
  color: #5a6a72;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kt-pcard__verified {
  flex-shrink: 0;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #7a5c1e;
  background: rgba(201, 169, 98, 0.16);
  padding: 0.12rem 0.35rem;
  border-radius: 999px;
}

`;
s = s.slice(0, start) + next + s.slice(end);
fs.writeFileSync(p, s);
console.log("replaced product card css");
