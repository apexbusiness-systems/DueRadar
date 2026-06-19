# DueRadar — Release & Operations Runbook

## Architecture Overview

| Component | Host | Tech |
|-----------|------|------|
| Frontend | Cloudflare Pages | React 19 + Vite |
| API | Fly.io (dueradar-api) | Node 24 + Express 5 |
| Database | Supabase / PostgreSQL | Drizzle ORM |
| Auth | Clerk | clerk.com |

---

## Required Secrets

### GitHub Actions Secrets
| Secret | Description |
|--------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for frontend build |
| `VITE_CLERK_PROXY_URL` | Clerk proxy URL (e.g. `https://dueradar.icu/api/__clerk`) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages write permission |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `DATABASE_URL` | PostgreSQL connection string for migrations |
| `FLY_API_TOKEN` | Fly.io deploy token |

### Fly.io Secrets (set via `flyctl secrets set`)
| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |
| `FLOWC_WEBHOOK_SECRET` | FlowC webhook HMAC secret |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Email delivery |
| `SENTRY_DSN` | (Optional) Sentry error tracking DSN |
| `ENABLE_REMINDER_SCHEDULER` | Set to `true` to enable reminder emails |

### Cloudflare Pages Environment Variables
| Variable | Description |
|----------|-------------|
| `API_ORIGIN` | Backend API origin (e.g. `https://dueradar-api.fly.dev`) |

---

## Deploy Process

### Automatic (via CI/CD)

Pushing to `main` triggers:
1. **Secret scan** — gitleaks checks for committed secrets
2. **Typecheck & test** — full typecheck + API integration tests
3. **Migrations** — checked-in Drizzle migrations applied to production DB
4. **API deploy** — Docker image built, pushed to GHCR, deployed to Fly.io
5. **Frontend deploy** — Vite production build, deployed to Cloudflare Pages

### Manual Deploy

```bash
# 1. Run migrations
DATABASE_URL="..." pnpm --filter @workspace/db run migrate

# 2. Deploy API to Fly.io
flyctl deploy --image ghcr.io/apexbusiness-systems/dueradar-api:<SHA>

# 3. Deploy frontend
NODE_ENV=production VITE_CLERK_PUBLISHABLE_KEY="..." pnpm --filter @workspace/frontend run build
pnpm exec wrangler pages deploy artifacts/frontend/dist/public --project-name=dueradar --branch=main
```

---

## Rollback Process

### API Rollback

```bash
# List recent deployed images
flyctl releases list

# Roll back to a previous release
flyctl releases rollback <version-number>
```

### Frontend Rollback

In the Cloudflare Pages dashboard:
1. Go to Workers & Pages > dueradar > Deployments
2. Find the last known-good deployment
3. Click "Rollback to this deployment"

### Database Rollback

There is no automated down-migration. Steps:
1. Identify the failing migration from logs
2. Manually revert the schema change using `psql` or the Supabase SQL editor
3. Remove the migration entry from `__drizzle_migrations` table if needed

---

## Smoke Test Checklist

After every deploy:

- [ ] `GET https://dueradar-api.fly.dev/api/healthz` returns `{ "status": "ok" }`
- [ ] Sign in to the app at `https://dueradar.icu`
- [ ] Dashboard loads with real metrics (not loading spinner)
- [ ] Obligations list loads
- [ ] Create a test obligation — confirm it appears in the list
- [ ] Open the obligation detail page
- [ ] CSV export downloads without error
- [ ] Reminder rule can be added to an obligation
- [ ] Workspace page loads member list

---

## Security Controls

| Control | Implementation |
|---------|---------------|
| Auth bypass prevention | `VITE_TEST_BYPASS_AUTH=true` fails production build |
| Secret scanning | gitleaks runs on every push in CI |
| Idempotency | DB-backed (PostgreSQL `idempotency_keys` table) |
| Webhook verification | Svix HMAC for Clerk; custom HMAC for FlowC |
| CSV formula injection | Leading `=+\-@\t\r` cells prefixed with `'` |
| CORS | Explicit allowlist via `ALLOWED_ORIGINS` env var |
| Rate limiting | Global 300 req/min, seed 10 req/min, import 20 req/min |
| Non-root Docker | `appuser` in `appgroup` (Alpine) |

---

## Monitoring & Alerts

Recommended alerts to configure:

| Alert | Condition | Channel |
|-------|-----------|---------|
| API 5xx rate | > 1% of requests over 5 min | PagerDuty |
| DB health | `healthz` reports `db != "connected"` | PagerDuty |
| Webhook failures | Svix/FlowC 400s > 3 per min | Slack |
| Migration failures | CI migrate job fails | Slack |
| Frontend deploy failures | CI deploy-frontend fails | Slack |

---

## Migration Recovery

If a migration fails mid-run:

1. Check Supabase logs for the specific SQL error
2. Connect with `psql $DATABASE_URL`
3. Query `SELECT * FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 5;`
4. Fix the migration SQL in `lib/db/drizzle/` (generate a new migration if needed)
5. Re-run: `DATABASE_URL="..." pnpm --filter @workspace/db run migrate`
6. If schema is inconsistent, restore from Supabase point-in-time recovery backup

---

## Local Development

```bash
# 1. Copy env files
cp artifacts/frontend/.env.example artifacts/frontend/.env
cp artifacts/api-server/.env.example artifacts/api-server/.env

# 2. Fill in your Clerk test keys and local DB URL

# 3. Install dependencies
pnpm install

# 4. Start API server
pnpm --filter @workspace/api-server run dev

# 5. Start frontend
pnpm --filter @workspace/frontend run dev
```

---

## Known Limitations

1. **Idempotency storage**: The PostgreSQL idempotency store has no TTL cleanup job. Run periodic cleanup with:
   ```sql
   DELETE FROM idempotency_keys WHERE created_at < NOW() - INTERVAL '24 hours';
   ```
   A scheduled pg_cron job or background task is recommended.

2. **E2E tests in CI**: Playwright E2E tests require `VITE_TEST_BYPASS_AUTH=true` in the test build. This is safe because the production CI build uses `NODE_ENV=production` which rejects this flag.

3. **Docker**: Not buildable in environments without a Docker daemon. Build on Fly.io remote builders or GitHub Actions.
