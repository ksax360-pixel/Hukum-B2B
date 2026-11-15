import assert from "node:assert/strict";
import { supplierProductFields, listingGaps } from "../../src/lib/product-edit";
const f = supplierProductFields({ name: { en: "A" }, status: "published", featured: true, vendorId: "x", verificationStatus: "verified", media: [{ url: "javascript:x" }, { url: "/api/media?path=public%2Fproducts%2Fa.jpg" }] });
assert.deepEqual(Object.keys(f).sort(), ["media", "name"]);
assert.equal((f.media as unknown[]).length, 1);
assert.deepEqual(listingGaps({ name: { en: "A" } }), ["photo", "description", "category", "price", "arabic", "brand"]);
assert.deepEqual(listingGaps({ name: { en: "A", ar: "أ" }, media: [1], description: { en: "x".repeat(50) }, categoryId: 1, price: 5, brand: "B" }), []);
console.log("product-edit ok");
