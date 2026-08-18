# Data-source registry

Document every external provider here before integrating it.

For each provider record:

- Data supplied and API documentation
- Authentication method and environment-variable names
- Rate limits and pricing
- Storage/caching restrictions
- Required attribution and content licence
- Refresh interval and stale-data behaviour
- Sandbox versus production behaviour
- Fallback provider or user-facing failure state

Never expose secret provider keys to browser code unless the provider explicitly requires a restricted public token.

## Current provider registry

| Provider | Used for | Auth | Runtime guardrails | Attribution |
| --- | --- | --- | --- | --- |
| OpenStreetMap Nominatim | Admin destination search and coordinates | No API key for current public endpoint | Custom `INGESTION_USER_AGENT`, cache TTL, user-triggered admin search, `PROVIDER_DAILY_REQUEST_LIMIT` | Link back to the OSM object/search result returned by the provider. |
| Wikimedia/Wikipedia REST | Destination summary, page title and thumbnail during import preview | No API key | Cache TTL, provider timeout, daily provider budget counter | Link to the source Wikipedia page returned by the provider. |
| OSRM public route service | Route distance, duration and geometry | No API key | Route cache TTL, timeout, daily provider budget counter, estimated fallback | Show route source as live provider or estimated fallback. |
| TravelVerse manual demo | Seeded showcase content | Internal | Production-safe seed data only | Internal `/sources/manual-demo` explainer. |
| TravelVerse admin curated | Admin-created destination drafts | Internal admin role | Audit log, draft/review workflow | Internal `/sources/admin-curated` explainer. |

## Publishing rule

Imported or admin-created content should stay in `DRAFT` until:

- source URLs open correctly,
- licence/credit notes are recorded,
- pricing is labelled as estimated/sandbox/live,
- and an admin has reviewed the destination story for obvious factual errors.
