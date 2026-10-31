/**
 * Document download ACL regression tests.
 * Usage: node scripts/qa-documents-acl.mjs [baseUrl]
 */
const BASE = process.argv[2] || process.env.QA_BASE_URL || "http://localhost:3000";
const results = [];

function record(name, status, detail = "") {
  results.push({ name, status, detail });
  console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  let json = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      json = await res.json();
    } catch {
      json = null;
    }
  }
  const text = ct.includes("application/json") ? null : await res.text();
  return { status: res.status, json, text, headers: res.headers };
}

async function login(email, password) {
  const { status, json } = await api("/api/auth", {
    method: "POST",
    body: { action: "login", email, password },
  });
  if (status !== 200 || !json?.data?.token) throw new Error(`login failed ${status}`);
  return json.data.token;
}

async function main() {
  console.log(`ACL base: ${BASE}`);
  const admin = await login("admin@kingdomtrade.demo", "Admin123!");
  const buyer = await login("buyer@kingdomtrade.demo", "Buyer123!");

  const created = await api("/api/documents", {
    method: "POST",
    token: admin,
    body: {
      action: "create_private_text",
      content: `qa-secret-${Date.now()}`,
      name: "qa-private.txt",
      visibility: "private",
      ownerType: "user",
    },
  });
  record(
    "Admin create private document",
    created.status === 201 && created.json?.success ? "PASS" : "FAIL",
    `http=${created.status}`
  );
  const id = created.json?.data?.id;
  if (!id) {
    console.log("Cannot continue without document id");
    process.exit(1);
  }

  const noAuth = await api(`/api/documents?id=${id}&download=1`);
  record("Unauthenticated download denied", noAuth.status === 401 ? "PASS" : "FAIL", `http=${noAuth.status}`);

  const buyerDl = await api(`/api/documents?id=${id}&download=1`, { token: buyer });
  record("Other tenant (buyer) download denied", buyerDl.status === 403 ? "PASS" : "FAIL", `http=${buyerDl.status}`);

  const adminMeta = await api(`/api/documents?id=${id}`, { token: admin });
  record(
    "Admin metadata allowed",
    adminMeta.status === 200 && adminMeta.json?.success ? "PASS" : "FAIL",
    `http=${adminMeta.status}`
  );
  if (adminMeta.json?.data?.fileUrl) {
    record("Metadata omits raw local path leak check", "FAIL", "fileUrl should not be returned");
  } else {
    record("Metadata omits fileUrl (storage kind only)", adminMeta.json?.data?.storage === "local" ? "PASS" : "FAIL");
  }

  const adminDl = await api(`/api/documents?id=${id}&download=1`, { token: admin });
  record(
    "Admin download allowed",
    adminDl.status === 200 && typeof adminDl.text === "string" && adminDl.text.includes("qa-secret")
      ? "PASS"
      : "FAIL",
    `http=${adminDl.status}`
  );

  const missing = await api(`/api/documents?id=000000000000000000000000&download=1`, { token: admin });
  record("Missing document → 404", missing.status === 404 ? "PASS" : "FAIL", `http=${missing.status}`);

  // Public doc: buyer (and unauth) may download
  const pub = await api("/api/documents", {
    method: "POST",
    token: admin,
    body: {
      action: "create_private_text",
      content: "public-ok",
      name: "qa-public.txt",
      visibility: "public",
      ownerType: "user",
    },
  });
  const pubId = pub.json?.data?.id;
  if (pubId) {
    const unauthPub = await api(`/api/documents?id=${pubId}&download=1`);
    record("Public visibility unauth download", unauthPub.status === 200 ? "PASS" : "FAIL", `http=${unauthPub.status}`);
  } else {
    record("Public visibility unauth download", "FAIL", "create failed");
  }

  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  console.log(`\n=== ACL SUMMARY PASS=${pass} FAIL=${fail} ===`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
