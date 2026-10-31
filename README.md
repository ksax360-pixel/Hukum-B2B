# Kingdom Trade

AI-powered Saudi B2B marketplace (modular Next.js monolith).

## Quick start

```bash
cd kingdom-trade
cp .env.example .env
npm install
npm run docker:up          # starts MongoDB
npm run seed               # fictional demo data
npm run dev                # http://localhost:3000
```

Demo accounts (seed):

- Admin: `admin@kingdomtrade.demo` / `Admin123!`
- Buyer: `buyer@kingdomtrade.demo` / `Buyer123!`
- Vendor: `vendor@kingdomtrade.demo` / `Vendor123!`

All seed companies and certifications are **fictional**.

## Docs

See `/docs` in the workspace root for architecture, database, API, RBAC, AI, taxonomy, deployment.

## Design

Visual language adapted from attached real-estate references (`../1` admin, `../2` public): white space, ink `#071d27`, accent red `#D21F1F`, Mulish + Tajawal, light/dark themes.
