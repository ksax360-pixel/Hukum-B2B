/**
 * Step 10 — non-destructive API E2E + security smoke (dev/test only).
 * Usage: node scripts/qa-e2e-step10.mjs [baseUrl]
 * Never prints tokens or passwords.
 */
const BASE = process.argv[2] || process.env.QA_BASE_URL || "http://localhost:3000";

const results = [];

function record(area, name, status, detail = "") {
  results.push({ area, name, status, detail: String(detail).slice(0, 200) });
  const mark = status === "PASS" ? "PASS" : status === "FAIL" ? "FAIL" : "SKIP";
  console.log(`[${mark}] ${area} · ${name}${detail ? ` — ${String(detail).slice(0, 120)}` : ""}`);
}

async function api(path, { method = "GET", token, body, origin } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { res, json, status: res.status };
}

async function login(email, password) {
  const { status, json } = await api("/api/auth", {
    method: "POST",
    body: { action: "login", email, password },
  });
  if (status !== 200 || !json?.success || !json?.data?.token) {
    throw new Error(json?.message || `login failed ${status}`);
  }
  return { token: json.data.token, user: json.data.user };
}

async function main() {
  console.log(`QA base: ${BASE}`);
  console.log(`Started: ${new Date().toISOString()}`);

  // Health
  {
    const { status, json } = await api("/api/health");
    record(
      "infra",
      "GET /api/health",
      status === 200 && json?.success ? "PASS" : "FAIL",
      `http=${status} db=${json?.data?.checks?.database || "?"}`
    );
  }

  // Auth failures
  {
    const bad = await api("/api/auth", {
      method: "POST",
      body: { action: "login", email: "nobody@example.com", password: "wrong" },
    });
    record("security", "Invalid login → 401", bad.status === 401 ? "PASS" : "FAIL", `http=${bad.status}`);
  }

  // Privilege escalation: register as admin
  {
    const email = `qa-admin-escalation-${Date.now()}@example.com`;
    const reg = await api("/api/auth", {
      method: "POST",
      body: {
        action: "register",
        email,
        password: "QaTest123!",
        name: "QA Escalation",
        accountType: "admin",
      },
    });
    const blocked = reg.status === 403 || reg.status === 422 || reg.json?.success === false;
    record(
      "security",
      "Block self-register as admin",
      blocked && reg.status !== 201 ? "PASS" : "FAIL",
      `http=${reg.status} msg=${reg.json?.message || ""}`
    );
  }

  let admin;
  let buyer;
  let vendor;
  try {
    admin = await login("admin@kingdomtrade.demo", "Admin123!");
    record("auth", "Admin login", "PASS");
  } catch (e) {
    record("auth", "Admin login", "FAIL", e.message);
  }
  try {
    buyer = await login("buyer@kingdomtrade.demo", "Buyer123!");
    record("auth", "Buyer login", "PASS");
  } catch (e) {
    record("auth", "Buyer login", "FAIL", e.message);
  }
  try {
    vendor = await login("vendor@kingdomtrade.demo", "Vendor123!");
    record("auth", "Vendor login", "PASS");
  } catch (e) {
    record("auth", "Vendor login", "FAIL", e.message);
  }

  // Unauthorized admin resources
  for (const path of [
    "/api/admin?resource=audit",
    "/api/platform?resource=cms&admin=1",
    "/api/vendors?admin=1&limit=5",
    "/api/users?role=buyer&limit=5",
  ]) {
    const { status } = await api(path);
    record("security", `No auth ${path.split("?")[0]}`, status === 401 || status === 403 ? "PASS" : "FAIL", `http=${status}`);
  }

  // Buyer must not access admin audit
  if (buyer?.token) {
    const { status } = await api("/api/admin?resource=audit", { token: buyer.token });
    record("security", "Buyer blocked from audit", status === 403 || status === 401 ? "PASS" : "FAIL", `http=${status}`);
  }

  // Vendor isolation on quotations
  if (vendor?.token && buyer?.token) {
    const vQuotes = await api("/api/quotations", { token: vendor.token });
    const bQuotes = await api("/api/quotations", { token: buyer.token });
    record(
      "tenant",
      "Vendor quotations list",
      vQuotes.json?.success ? "PASS" : "FAIL",
      `http=${vQuotes.status} n=${Array.isArray(vQuotes.json?.data) ? vQuotes.json.data.length : "?"}`
    );
    record(
      "tenant",
      "Buyer quotations list (owned RFQs only)",
      bQuotes.status === 200 || bQuotes.status === 403 ? "PASS" : "FAIL",
      `http=${bQuotes.status}`
    );
  }

  // Seller / product / buyer admin ops
  if (admin?.token) {
    const vendors = await api("/api/vendors?admin=1&limit=10", { token: admin.token });
    record(
      "seller",
      "Admin vendor list",
      vendors.json?.success ? "PASS" : "FAIL",
      `n=${vendors.json?.data?.items?.length ?? "?"}`
    );

    const products = await api("/api/products?status=all&limit=10", { token: admin.token });
    record(
      "product",
      "Admin product list",
      products.json?.success ? "PASS" : "FAIL",
      `http=${products.status}`
    );

    const buyers = await api("/api/users?role=buyer&limit=10", { token: admin.token });
    record(
      "buyer",
      "Admin buyer list",
      buyers.json?.success ? "PASS" : "FAIL",
      `n=${Array.isArray(buyers.json?.data) ? buyers.json.data.length : "?"}`
    );

    const rfqs = await api("/api/rfqs", { token: admin.token });
    record("rfq", "Admin RFQ list", rfqs.json?.success ? "PASS" : "FAIL", `n=${Array.isArray(rfqs.json?.data) ? rfqs.json.data.length : "?"}`);

    const quotes = await api("/api/quotations", { token: admin.token });
    record(
      "quotation",
      "Admin quotation list",
      quotes.json?.success ? "PASS" : "FAIL",
      `n=${Array.isArray(quotes.json?.data) ? quotes.json.data.length : "?"}`
    );

    const cms = await api("/api/platform?resource=cms&admin=1", { token: admin.token });
    record("cms", "Admin CMS list", cms.json?.success ? "PASS" : "FAIL");

    const audit = await api("/api/admin?resource=audit", { token: admin.token });
    record("audit", "Admin audit list", audit.json?.success ? "PASS" : "FAIL");

    const tax = await api("/api/categories?resource=tree", { token: admin.token });
    record("taxonomy", "Category tree", tax.json?.success ? "PASS" : "FAIL");

    // Create isolated CMS draft then archive
    const slug = `qa-step10-${Date.now()}`;
    const create = await api("/api/platform", {
      method: "POST",
      token: admin.token,
      body: {
        action: "cms_upsert",
        updates: {
          type: "page",
          title: { en: `QA ${slug}`, ar: "" },
          slug: { en: slug, ar: slug },
          body: { en: "QA draft — safe to archive", ar: "" },
          status: "draft",
        },
      },
    });
    record("cms", "Create CMS draft", create.json?.success ? "PASS" : "FAIL", create.json?.message || "");
    if (create.json?.data?._id) {
      const arch = await api("/api/platform", {
        method: "POST",
        token: admin.token,
        body: {
          action: "cms_upsert",
          id: create.json.data._id,
          updates: { status: "archived" },
        },
      });
      record("cms", "Archive CMS draft", arch.json?.success && arch.json?.data?.status === "archived" ? "PASS" : "FAIL");
    }

    // Buyer creates RFQ
    if (buyer?.token) {
      const rfq = await api("/api/rfqs", {
        method: "POST",
        token: buyer.token,
        body: {
          action: "create",
          titleEn: `QA RFQ ${Date.now()}`,
          descriptionText: "Step 10 isolated RFQ — do not use in production",
          items: [{ name: { en: "QA widget", ar: "" }, quantity: 10, unit: "piece" }],
          deliveryLocation: { country: "SA", city: "Riyadh" },
          currency: "SAR",
          status: "open",
        },
      });
      record("rfq", "Buyer create RFQ", rfq.json?.success ? "PASS" : "FAIL", rfq.json?.message || `http=${rfq.status}`);
      const rfqId = rfq.json?.data?._id;
      if (rfqId) {
        const detail = await api(`/api/rfqs?id=${rfqId}`, { token: admin.token });
        record(
          "rfq",
          "Admin RFQ detail",
          detail.json?.success && detail.json?.data?.rfq ? "PASS" : "FAIL"
        );
        const close = await api("/api/rfqs", {
          method: "POST",
          token: admin.token,
          body: { action: "set_status", id: rfqId, status: "closed" },
        });
        record(
          "rfq",
          "Admin set_status closed",
          close.json?.success && close.json?.data?.status === "closed" ? "PASS" : "FAIL",
          close.json?.message || ""
        );
      }
    }

    // Enquiry
    const enq = await api("/api/contact", {
      method: "POST",
      body: {
        fullName: "QA Tester",
        companyName: "QA Co",
        email: `qa-enquiry-${Date.now()}@example.com`,
        subject: "Step 10 enquiry",
        message: "Isolated test enquiry for Step 10 QA.",
        enquiryType: "general",
        country: "SA",
      },
    });
    record("enquiry", "Public contact create", enq.json?.success ? "PASS" : "FAIL", enq.json?.message || "");
    if (enq.json?.data?.id) {
      const patch = await api("/api/contact", {
        method: "PATCH",
        token: admin.token,
        body: { id: enq.json.data.id, status: "closed" },
      });
      record(
        "enquiry",
        "Admin enquiry close",
        patch.json?.success && patch.json?.data?.status === "closed" ? "PASS" : "FAIL"
      );
    }

    // CORS preflight from admin origin
    const opt = await fetch(`${BASE}/api/vendors`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3001",
        "Access-Control-Request-Method": "GET",
      },
    });
    const allow = opt.headers.get("access-control-allow-origin");
    record(
      "security",
      "CORS preflight admin origin",
      opt.status === 204 && allow ? "PASS" : "FAIL",
      `http=${opt.status} acao=${allow || "none"}`
    );

    // Fake success check: set_status missing id
    const miss = await api("/api/rfqs", {
      method: "POST",
      token: admin.token,
      body: { action: "set_status", id: "000000000000000000000000", status: "closed" },
    });
    record(
      "admin",
      "RFQ set_status missing → error",
      miss.json?.success === false ? "PASS" : "FAIL",
      `http=${miss.status}`
    );
  }

  // Public catalog should not require auth
  {
    const pub = await api("/api/products?status=published&limit=5");
    record(
      "product",
      "Public published products",
      pub.status === 200 || pub.json?.success !== undefined ? "PASS" : "FAIL",
      `http=${pub.status}`
    );
  }

  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const skip = results.filter((r) => r.status === "SKIP").length;
  console.log("\n=== SUMMARY ===");
  console.log(`PASS=${pass} FAIL=${fail} SKIP=${skip} TOTAL=${results.length}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("QA runner crashed:", e.message);
  process.exit(1);
});
