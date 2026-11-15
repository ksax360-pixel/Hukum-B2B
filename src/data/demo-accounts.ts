export const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    roleAr: "مسؤول",
    email: "admin@hukum-ksa.com",
    password: "Admin123!",
    name: "Platform Admin",
    roles: ["super_admin", "admin"],
  },
  {
    role: "Vendor",
    roleAr: "مورد",
    email: "seller@hukum-ksa.com",
    password: "Seller123!",
    name: "Hukum Seller",
    roles: ["vendor_owner"],
  },
  {
    role: "Buyer",
    roleAr: "مشتري",
    email: "buyer@hukum-ksa.com",
    password: "Buyer123!",
    name: "Hukum Buyer",
    roles: ["buyer", "buyer_org_admin"],
  },
] as const;
