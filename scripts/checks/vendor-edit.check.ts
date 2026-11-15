import assert from "node:assert/strict";
import { supplierEditable, cleanDesign, safeImage } from "../../src/lib/vendor-edit";

// Suppliers cannot promote themselves or touch staff-only fields.
const out = supplierEditable({ verificationStatus: "verified", status: "verified", featured: true, plan: "premium", storefront: {}, tradeName: "Acme" }, false);
assert.deepEqual(out, { tradeName: "Acme" });
// Legal identity locks after verification.
assert.equal("crNumber" in supplierEditable({ crNumber: "1" }, true), false);
assert.equal(supplierEditable({ crNumber: "1" }, false).crNumber, "1");

assert.equal(safeImage("javascript:alert(1)"), "");
assert.equal(safeImage("data:image/svg+xml;base64,AAAA"), "");
assert.equal(safeImage("data:image/png;base64,AAAA"), "data:image/png;base64,AAAA");
const d = cleanDesign({ primaryColor: "red;", headline: { en: "x".repeat(200) }, evil: 1, banner: "https://cdn.example.com/a.jpg" });
assert.equal(d.primaryColor, "#17634B");
assert.equal(d.headline.en?.length, 80);
assert.equal("evil" in d, false);
assert.deepEqual(d.bannerImages, ["https://cdn.example.com/a.jpg"]);
console.log("vendor-edit ok");
import { isCrNumber, isVatNumber } from "../../src/lib/vendor-edit";
assert.ok(isCrNumber("1010123456")); assert.ok(!isCrNumber("101012345"));
assert.ok(isVatNumber("300000000000003")); assert.ok(!isVatNumber("310000000000004"));
console.log("cr/vat ok");
assert.equal(safeImage("/api/media?path=public%2Fcompanies%2Fx%2Flogo%2Fa.jpg"), "/api/media?path=public%2Fcompanies%2Fx%2Flogo%2Fa.jpg");
assert.equal(safeImage("/api/media?path=private%2Fdocuments%2Fx.pdf"), "");
console.log("media url ok");
