/** Public base URL for the seller panel (register / login). */
export function sellerAdminUrl(path = "/") {
  const base = (process.env.NEXT_PUBLIC_SELLER_ADMIN_URL || "http://localhost:3002").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function sellerRegisterUrl() {
  return sellerAdminUrl("/register");
}

export function sellerLoginUrl() {
  return sellerAdminUrl("/login");
}
