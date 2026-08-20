# TravelVerse production runbook

Use this runbook for Day 13 deployment readiness. The repo is ready for independent client and server deployment, but actual cloud resources must be created with your own accounts and secrets.

## 1. Required production services

- Managed MongoDB database with automated backups.
- Server host for the NestJS API.
- Client host for the Next.js app.
- HTTPS domains for both client and API.
- Google OAuth credentials if Google login is enabled.
- Optional error-monitoring project such as Sentry.

## 2. Environment setup

Start from `.env.production.example`.

Important server values:

- `NODE_ENV=production`
- `CLIENT_URL=https://your-client-domain`
- `MONGODB_URI=mongodb+srv://...`
- `JWT_SECRET` with at least 32 random characters.
- `GOOGLE_CALLBACK_URL=https://your-api-domain/api/auth/google/callback`
- `OAUTH_SUCCESS_REDIRECT_URL=https://your-client-domain/account`
- `OAUTH_FAILURE_REDIRECT_URL=https://your-client-domain/login?oauth=failed`
- `LOG_FORMAT=json`
- `RELEASE_SHA` set from the Git commit being deployed.
- `TRUST_PROXY_HOPS=1` when the API sits behind a platform proxy/load balancer.

Important client value:

- `NEXT_PUBLIC_API_URL=https://your-api-domain/api`

Never expose server-only secrets to the client deployment.

The API intentionally refuses to start in `NODE_ENV=production` when it detects unsafe development defaults such as localhost URLs, the default admin credentials, the local MongoDB URI or the development JWT secret.

## 3. Build and release validation

Run these before deploying a release:

```bash
pnpm.cmd install
pnpm.cmd test
pnpm.cmd lint
pnpm.cmd typecheck
pnpm.cmd build
```

For browser QA, start the client on the configured Playwright port and run:

```bash
pnpm.cmd --filter @travelverse/client test:e2e
```

## 4. Database seeding

Seed only after production environment variables are set correctly:

```bash
pnpm.cmd db:seed
```

Production seed notes:

- Change `ADMIN_EMAIL`, `ADMIN_NAME` and `ADMIN_PASSWORD` before seeding.
- The seed creates showcase destinations and estimated hotel data only.
- Imported destinations must stay as drafts until an admin verifies source attribution.
- Rotate the seeded admin password after the first successful login.

## 5. Health checks and logs

Configure platform probes:

- Liveness: `GET https://your-api-domain/api/health`
- Readiness: `GET https://your-api-domain/api/health/readiness`

The readiness endpoint returns `503` when the database is not connected. Use it for deployment rollouts.

For production logs:

- Set `LOG_FORMAT=json`.
- Keep the `x-request-id` response header; use it when debugging user reports.
- Set `SENTRY_DSN` only on the server if error monitoring is enabled.

## 6. Provider quota and cost guardrails

TravelVerse calls public providers only from the server. Current providers are:

- Nominatim/OpenStreetMap for geocoding search.
- Wikimedia/Wikipedia for knowledge and media summaries.
- OSRM for route estimates.

Guardrail variables:

- `PROVIDER_DAILY_REQUEST_LIMIT` caps server-side live provider calls per UTC day.
- `PROVIDER_MONTHLY_BUDGET_INR` documents the planned monthly spend limit for paid providers. Keep `0` while using free/public providers.
- `INGESTION_CACHE_TTL_SECONDS` and `ROUTING_CACHE_TTL_SECONDS` reduce repeated provider calls.

When provider quota is exhausted, admin import/live routing should fail gracefully or fall back to estimated data depending on the feature.

## 7. Production smoke checklist

After deployment:

- Open the client home page.
- Open `/explore` and search a seeded city.
- Open one destination detail page and verify the route planner renders.
- Open a source note such as `/sources/manual-demo`.
- Login as admin and open `/admin/destinations`.
- Create or import a draft destination, then publish/archive it.
- Check `/api/health/readiness` returns `200`.
- Confirm logs include request method, path, status code, duration and request id.
- Confirm MongoDB backups are enabled in the database provider.

## 8. Known MVP limits

- Transport and hotel prices are estimates/sandbox data unless a provider marks them as live.
- Public provider data must be verified by an admin before publishing.
- The chatbot is planned for a later phase and should answer only from verified application data.
