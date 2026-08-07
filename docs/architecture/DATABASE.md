# Database Model

TravelVerse uses MongoDB with Mongoose. The database is document-first because destination pages contain nested content such as history sections, attractions, media, food, dance, festivals and source attribution.

## Local Database

```bash
docker compose up -d mongodb redis
pnpm.cmd db:seed
```

Default local MongoDB URI:

```text
mongodb://travelverse:travelverse@localhost:27017/travelverse?authSource=admin
```

## Collections

| Collection | Purpose |
| --- | --- |
| `users` | User/admin accounts, password hashes and roles |
| `destinations` | Core destination content, publish status, attractions, sections, media and source metadata |
| `hotels` | Hotel and room estimates for MVP search and simulated bookings |
| `itineraries` | Day-wise user trip plans and estimated totals |
| `bookings` | Simulated hotel/trip booking records |
| `reviews` | User ratings and comments for destinations |
| `favourites` | Unique saved destinations per user |

## Important Indexes

- `users.email` is unique.
- `destinations.slug` is unique.
- `destinations.status`, `name`, `region`, `country` and `tags` support public discovery/admin filters.
- `destinations` has a text index for search across name, region, country, tags and cultural highlights.
- `hotels.destinationSlug` and rating support hotel listing.
- `favourites` has a unique compound index on `userId + destinationSlug`.

## Seed Data

The seed script creates:

- one admin user from `ADMIN_EMAIL`, `ADMIN_NAME` and `ADMIN_PASSWORD`
- three showcase destinations: Jaipur, Varanasi and Goa
- one starter hotel estimate for each showcase destination

Real external provider imports will later save data as `DRAFT` first. Admin review/publishing decides what users can see.
