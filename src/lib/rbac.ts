export const ROLES = [
  "super_admin",
  "admin",
  "vendor_verification_admin",
  "product_admin",
  "content_admin",
  "seo_manager",
  "finance_admin",
  "support_admin",
  "analytics_manager",
  "ai_admin",
  "buyer",
  "buyer_org_admin",
  "vendor_owner",
  "vendor_manager",
  "vendor_sales",
  "vendor_content",
] as const;

export type RoleKey = (typeof ROLES)[number];

export const ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "reject",
  "publish",
  "export",
  "manage",
  "configure",
] as const;

export type ActionKey = (typeof ACTIONS)[number];

export const RESOURCES = [
  "users",
  "organizations",
  "vendors",
  "buyers",
  "products",
  "categories",
  "industries",
  "rfqs",
  "quotations",
  "messages",
  "documents",
  "verification",
  "ai",
  "search",
  "seo",
  "analytics",
  "subscriptions",
  "payments",
  "notifications",
  "admin",
  "cms",
  "settings",
] as const;

export type ResourceKey = (typeof RESOURCES)[number];

export type Permission = `${ResourceKey}:${ActionKey}`;

const all = (resource: ResourceKey): Permission[] =>
  ACTIONS.map((a) => `${resource}:${a}` as Permission);

const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  super_admin: RESOURCES.flatMap((r) => all(r)),
  admin: RESOURCES.flatMap((r) => all(r)),
  vendor_verification_admin: [
    "vendors:view",
    "vendors:approve",
    "vendors:reject",
    "vendors:manage",
    "documents:view",
    "documents:approve",
    "verification:view",
    "verification:approve",
    "verification:reject",
    "verification:manage",
  ],
  product_admin: [
    "products:view",
    "products:edit",
    "products:approve",
    "products:reject",
    "products:publish",
    "products:manage",
    "categories:view",
    "industries:view",
  ],
  content_admin: ["cms:view", "cms:create", "cms:edit", "cms:publish", "cms:manage"],
  seo_manager: ["seo:view", "seo:edit", "seo:manage", "seo:configure", "products:view", "vendors:view", "categories:view"],
  finance_admin: [
    "subscriptions:view",
    "subscriptions:manage",
    "payments:view",
    "payments:manage",
    "analytics:view",
  ],
  support_admin: [
    "users:view",
    "vendors:view",
    "buyers:view",
    "messages:view",
    "messages:create",
    "messages:manage",
    "notifications:manage",
  ],
  analytics_manager: ["analytics:view", "analytics:export", "analytics:manage"],
  ai_admin: ["ai:view", "ai:manage", "ai:configure", "documents:view"],
  buyer: [
    "products:view",
    "vendors:view",
    "rfqs:view",
    "rfqs:create",
    "rfqs:edit",
    "quotations:view",
    "messages:view",
    "messages:create",
    "search:view",
  ],
  buyer_org_admin: [
    "products:view",
    "vendors:view",
    "rfqs:view",
    "rfqs:create",
    "rfqs:edit",
    "rfqs:manage",
    "quotations:view",
    "organizations:view",
    "organizations:edit",
    "organizations:manage",
    "messages:view",
    "messages:create",
  ],
  vendor_owner: [
    "vendors:view",
    "vendors:edit",
    "vendors:manage",
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    "products:publish",
    "rfqs:view",
    "quotations:view",
    "quotations:create",
    "quotations:edit",
    "documents:view",
    "documents:create",
    "messages:view",
    "messages:create",
    "analytics:view",
    "ai:create",
    "subscriptions:view",
    "products:export",
  ],
  vendor_manager: [
    "vendors:view",
    "vendors:edit",
    "products:view",
    "products:create",
    "products:edit",
    "rfqs:view",
    "quotations:view",
    "quotations:create",
    "documents:view",
    "messages:view",
    "messages:create",
    "analytics:view",
  ],
  vendor_sales: [
    "products:view",
    "rfqs:view",
    "quotations:view",
    "quotations:create",
    "quotations:edit",
    "messages:view",
    "messages:create",
  ],
  vendor_content: [
    "products:view",
    "products:create",
    "products:edit",
    "documents:view",
    "documents:create",
    "ai:create",
  ],
};

export function permissionsForRoles(roles: string[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role as RoleKey];
    if (perms) perms.forEach((p) => set.add(p));
  }
  return set;
}

export function hasPermission(roles: string[], permission: Permission): boolean {
  return permissionsForRoles(roles).has(permission);
}
