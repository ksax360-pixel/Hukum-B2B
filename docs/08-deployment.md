# Deployment, Docker & Environment

## Docker Compose services

- `app` — Next.js
- `mongo` — MongoDB 7
- Commented placeholders: `redis`, `opensearch`, `minio` (object storage)

## Environment variables (see `.env.example`)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Database connection |
| `AUTH_SECRET` | Session/JWT secret |
| `AI_API_KEY` | AI provider key |
| `AI_BASE_URL` | OpenAI-compatible base URL |
| `AI_MODEL` | Default model |
| `AI_CONFIDENCE_THRESHOLD` | 0–1 |
| `SMS_PROVIDER` / keys | OTP (optional) |
| `PAYMENT_PROVIDER` | Payment adapter |
| `STORAGE_*` | Object storage (optional; local uploads default) |
| `NEXT_PUBLIC_APP_URL` | Public URL |

Never commit secrets.

## Local

```bash
cd kingdom-trade
cp .env.example .env
docker compose up -d mongo
npm run dev
```

## Microservice migration

Each `src/modules/*` maps 1:1 to a future service. Extract by: freeze API contract → move service+repo → introduce gateway → deprecate monolith route.
