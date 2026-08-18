# TravelVerse API endpoints

All endpoints are served under the `/api` prefix.

## Health and operations

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Liveness response for uptime checks. Includes release, uptime, database state and provider budget snapshot. |
| `GET` | `/health/readiness` | Public | Readiness probe. Returns `503` when the API process is alive but the database is not ready. |

## Authentication

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Create a user and set the HttpOnly session cookie. |
| `POST` | `/auth/login` | Public | Login with credentials and set the HttpOnly session cookie. |
| `POST` | `/auth/logout` | User | Clear the session cookie. |
| `GET` | `/auth/me` | User | Return the current authenticated user. |
| `GET` | `/auth/admin-check` | Admin | Verify that the current user has admin access. |
| `GET` | `/auth/google/status` | Public | Tell the client whether Google OAuth is configured. |
| `GET` | `/auth/google` | Public | Start Google OAuth. |
| `GET` | `/auth/google/callback` | Public | Complete Google OAuth and set the session cookie. |

## Public discovery

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/destinations` | Public | Paginated published destinations with search/filter query support. |
| `GET` | `/destinations/facets` | Public | Filter values for region, category, activity and tags. |
| `GET` | `/destinations/:slug` | Public | Published destination detail with story, culture, media and source metadata. |
| `GET` | `/hotels?destinationSlug=:slug` | Public | Hotel and room estimates for a destination. |
| `POST` | `/routes/estimate` | Public | Route distance, duration and geometry using OSRM with estimated fallback. |
| `POST` | `/transport/compare` | Public | Transport comparison and estimated costing across available provider modes. |

## Authenticated planning

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/favourites` | User | List saved destination slugs. |
| `POST` | `/favourites/:slug` | User | Save a destination. |
| `DELETE` | `/favourites/:slug` | User | Remove a saved destination. |
| `GET` | `/itineraries` | User | List saved itineraries for the current user. |
| `POST` | `/itineraries` | User | Save a trip plan. |
| `GET` | `/bookings` | User | List simulated booking history for the current user. |
| `POST` | `/bookings` | User | Create a simulated booking after date and ownership validation. |

## Admin content workflow

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/admin/destinations` | Admin | List drafts, review items, published and archived content. |
| `POST` | `/admin/destinations` | Admin | Create a destination draft. |
| `GET` | `/admin/destinations/:slug` | Admin | Load a destination for editing. |
| `PATCH` | `/admin/destinations/:slug` | Admin | Update destination content and metadata. |
| `POST` | `/admin/destinations/:slug/publish` | Admin | Publish reviewed content. |
| `POST` | `/admin/destinations/:slug/archive` | Admin | Archive content. |
| `GET` | `/admin/destinations/import/search` | Admin | Search external provider matches. |
| `POST` | `/admin/destinations/import/preview` | Admin | Build a normalized draft preview with source attribution. |
| `POST` | `/admin/destinations/import` | Admin | Save an imported destination as a draft. |

Protected routes use the HttpOnly session cookie created by login/register/Google OAuth.
