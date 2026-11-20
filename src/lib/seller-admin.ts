/** Where suppliers sign in and register. When NEXT_PUBLIC_SELLER_ADMIN_URL points at a separate seller app
 *  (staging/production) the links go there; otherwise they use this app's own supplier portal. */
const external = (): string => {
  const fromEnv = (process.env.NEXT_PUBLIC_SELLER_ADMIN_URL || "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  // Live marketplace always ships a separate seller app.
  const app = (process.env.NEXT_PUBLIC_APP_URL || "").toLowerCase();
  if (app.includes("hukum-ksa.com") || app.includes("hukum.sa")) {
    return "https://seller.hukum-ksa.com";
  }
  return "";
};

export function sellerAdminUrl(path = "/") {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${external()}${p}`;
}

export function sellerRegisterUrl(locale = "en") {
  return external() ? sellerAdminUrl("/register") : `/${locale}/register?role=vendor`;
}

export function sellerLoginUrl(locale = "en") {
  return external() ? sellerAdminUrl("/login") : `/${locale}/login?next=${encodeURIComponent(`/${locale}/vendor/dashboard`)}`;
}

export function sellerIsExternal(): boolean {
  return Boolean(external());
}
