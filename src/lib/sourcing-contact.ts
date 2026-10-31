import { SITE_CONTACT } from "@/data/site-contact";
import { whatsappLink } from "@/components/products/product-helpers";

/** Prefer public WhatsApp; otherwise fall back to contact page. */
export function sourcingWhatsAppHref(locale: "en" | "ar", prefills?: string) {
  const wa = whatsappLink(SITE_CONTACT.whatsapp);
  if (wa) {
    const text = prefills || (locale === "ar"
      ? "مرحباً Hukum، أحتاج مساعدة في التوريد."
      : "Hi Hukum, I need sourcing help.");
    return `${wa}?text=${encodeURIComponent(text)}`;
  }
  return `/${locale}/contact`;
}

export function sourcingWhatsAppIsExternal() {
  return Boolean(whatsappLink(SITE_CONTACT.whatsapp));
}
