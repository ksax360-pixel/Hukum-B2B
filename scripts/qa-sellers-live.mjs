/**
 * Live seller verify regression (approve/reject cycle on disposable vendor).
 * Usage: node scripts/qa-sellers-live.mjs
 */
const BASE = process.argv[2] || "http://localhost:3000";

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function login(email, password) {
  const { status, json } = await api("/api/auth", {
    method: "POST",
    body: { action: "login", email, password },
  });
  if (!json?.data?.token) throw new Error(`login ${status}`);
  return json.data.token;
}

function assert(cond, msg) {
  console.log(`[${cond ? "PASS" : "FAIL"}] ${msg}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  const admin = await login("admin@kingdomtrade.demo", "Admin123!");
  const buyer = await login("buyer@kingdomtrade.demo", "Buyer123!");

  const denied = await api("/api/vendors?admin=1&limit=5", { token: buyer });
  assert(denied.status === 403 || denied.json?.success === false, `Buyer admin vendor list blocked (${denied.status})`);

  const list = await api("/api/vendors?admin=1&limit=20", { token: admin });
  assert(list.json?.success, "Admin seller list");
  const item = list.json?.data?.items?.[0];
  assert(Boolean(item?._id), "At least one vendor for verify test");
  if (!item?._id) return;

  const id = item._id;
  const prev = item.verificationStatus;

  const bad = await api("/api/vendors", {
    method: "POST",
    token: buyer,
    body: { action: "verify", id, status: "verified" },
  });
  assert(bad.status === 403 || bad.json?.success === false, `Buyer verify denied (${bad.status})`);

  const reject = await api("/api/vendors", {
    method: "POST",
    token: admin,
    body: { action: "verify", id, status: "rejected" },
  });
  assert(reject.json?.success && reject.json?.data?.verificationStatus === "rejected", "Admin reject server-confirmed");

  const again = await api("/api/vendors", {
    method: "POST",
    token: admin,
    body: { action: "verify", id, status: "rejected" },
  });
  assert(again.json?.success, "Duplicate reject is idempotent/success");

  // Restore previous-ish state to verified for demo continuity when it was verified
  const restoreStatus = prev === "pending" ? "verified" : prev === "unverified" ? "verified" : prev || "verified";
  const restore = await api("/api/vendors", {
    method: "POST",
    token: admin,
    body: { action: "verify", id, status: restoreStatus === "rejected" ? "verified" : restoreStatus },
  });
  assert(restore.json?.success, `Restore verification → ${restore.json?.data?.verificationStatus}`);

  const refresh = await api(`/api/vendors?admin=1&q=${encodeURIComponent(item.email || "")}&limit=5`, {
    token: admin,
  });
  assert(refresh.json?.success, "List refresh after action");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
