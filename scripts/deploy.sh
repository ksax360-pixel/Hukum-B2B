#!/usr/bin/env bash
# Build and (re)start Kingdom Trade on PM2 → https://kingdomtrade.x-360.ai
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build
test -f .next/BUILD_ID

pm2 delete kingdomtrade-web >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs --env production
pm2 save

sleep 4
curl -sS -m 20 -o /dev/null -w "local:%{http_code}\n" http://127.0.0.1:3050/
curl -sS -m 20 -o /dev/null -w "public:%{http_code}\n" https://kingdomtrade.x-360.ai/
