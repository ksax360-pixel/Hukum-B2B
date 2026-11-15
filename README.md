# Hukum (B2B marketplace)

Next.js 15 App Router marketplace for verified Saudi suppliers. Locales: `en` / `ar`.

## Requirements

- Node.js **20+** (recommended 20 LTS or 22 LTS)
- npm 10+
- MongoDB (local Docker or Atlas)

## Fresh install (zip without `node_modules`)

```bash
# 1) Unzip into a folder, then:
cd Hukum-B2B-main   # or whatever the folder is named

# 2) Env — never commit real secrets
cp .env.example .env
# Edit .env: MONGODB_URI, AUTH_SECRET (32+ chars), NEXT_PUBLIC_APP_URL

# 3) Install from lockfile (reproducible)
npm ci
# If npm ci fails on an older npm, use: npm install

# 4) Database
npm run docker:up          # local Mongo on :27017
# or point MONGODB_URI at Atlas

# 5) Optional demo data
npm run seed

# 6) Dev
npm run dev                # http://localhost:3000
```

## Production

```bash
# Set in .env / host:
# NEXT_PUBLIC_APP_URL=https://www.hukum.sa
# NODE_ENV=production
# ENABLE_DEMO_ACCOUNTS=false
# PAYMENT_PROVIDER=none   # or real provider
# AUTH_SECRET=<long random>
# MONGODB_URI=<production>

npm ci
npm run build
npm run start              # http://localhost:3000
```

## What to exclude when zipping for developers

Do **not** include:

- `node_modules/`
- `.next/`
- `.env` (share secrets out-of-band; keep `.env.example`)
- `uploads/` (user files)
- `logs/`
- `.vercel/`

**Do** include:

- `package.json` + `package-lock.json`
- `.env.example`
- `public/`, `src/`, `scripts/`, config files

Helper (PowerShell, from repo root):

```powershell
.\scripts\pack-for-devs.ps1
```

## Demo accounts (after `npm run seed`)

- Admin: `admin@kingdomtrade.demo` / `Admin123!`
- Buyer: `buyer@kingdomtrade.demo` / `Buyer123!`
- Vendor: `vendor@kingdomtrade.demo` / `Vendor123!`

Seed companies are **fictional**.

## Stack notes

- App: Next.js 15, React 19, next-intl, Tailwind 4
- DB: MongoDB + Mongoose
- Auth: jose JWT (`AUTH_SECRET`)
- AI chat / search: optional via `AI_API_KEY` (graceful if empty)

## Docs

See `/docs` for architecture, API, RBAC, and deployment notes when present in the workspace.
