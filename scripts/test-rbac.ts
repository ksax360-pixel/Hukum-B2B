import { hasPermission, permissionsForRoles } from "../src/lib/rbac";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function run() {
  // Vendor owner can manage own products
  assert(hasPermission(["vendor_owner"], "products:create"), "vendor_owner should create products");
  assert(hasPermission(["vendor_owner"], "quotations:create"), "vendor_owner should create quotations");

  // Buyer cannot manage vendors
  assert(!hasPermission(["buyer"], "vendors:approve"), "buyer must not approve vendors");
  assert(!hasPermission(["buyer"], "admin:manage"), "buyer must not manage admin");

  // Vendor sales cannot configure AI
  assert(!hasPermission(["vendor_sales"], "ai:configure"), "vendor_sales must not configure AI");

  // Super admin has all
  const perms = permissionsForRoles(["super_admin"]);
  assert(perms.has("ai:configure"), "super_admin needs ai:configure");
  assert(perms.has("products:publish"), "super_admin needs products:publish");

  // Isolation principle encoded as permission boundaries
  assert(hasPermission(["buyer"], "rfqs:create"), "buyer can create RFQs");
  assert(!hasPermission(["vendor_content"], "rfqs:create"), "vendor_content cannot create buyer RFQs");

  console.log("RBAC isolation tests passed");
}

run();
