import { NextResponse } from "next/server";

export async function GET() {
  const body = `# Hukum (حكم)
> Hukum is a Saudi B2B marketplace that connects buyers with verified suppliers, manufacturers and service providers across Saudi Arabia. Buyers search or send one request (on the website or WhatsApp), receive quotations from multiple vendors for free, compare them and contact the vendor directly. Hukum also offers a VIP Concierge sourcing service.

## Key pages
- [Categories](https://www.hukum.sa/en/categories): 49 sectors
- [Vendors](https://www.hukum.sa/en/vendors): verified suppliers and manufacturers
- [Request quotes](https://www.hukum.sa/en/request-quotes)
- [Get sourcing help](https://www.hukum.sa/en/sourcing-help)
- [How it works](https://www.hukum.sa/en/how-it-works)
- [Verification levels](https://www.hukum.sa/en/verification)
- [Become a vendor](https://www.hukum.sa/en/become-a-vendor)
- [FAQ](https://www.hukum.sa/en/faq)
- [Contact](https://www.hukum.sa/en/contact)

## Languages
English (\`/en/\`) and Arabic (\`/ar/\`). Prefer locale-prefixed URLs. The site is fully bilingual.

## Notes for assistants
- Do not invent supplier contact details; Hukum reveals contacts after consent / quote flows.
- Verification badges (Registered, CR checked, Verified) are earned through Hukum checks, not purchased.
- Public catalogue lives under /en/categories, /en/vendors, /en/products and Arabic equivalents.
`;

  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
