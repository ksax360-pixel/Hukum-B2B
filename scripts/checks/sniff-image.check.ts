import assert from "node:assert/strict";
import { sniffImage } from "../../src/lib/sniff-image";
assert.equal(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0])), "image/jpeg");
assert.equal(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), "image/png");
assert.equal(sniffImage(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
assert.equal(sniffImage(new TextEncoder().encode("<svg onload=alert(1)>")), "");
console.log("sniff-image ok");
