# TravelVerse 3D

An immersive travel discovery and planning platform built with TypeScript, React/Next.js and NestJS.

## Day 1 Setup

This repository is a pnpm monorepo with two independently deployable applications:

- `apps/client` - Next.js React frontend, admin UI, maps and React Three Fiber experiences
- `apps/server` - NestJS API, MongoDB/Mongoose, ingestion and external provider adapters
- `packages/contracts` - shared Zod schemas and inferred TypeScript types
- `packages/typescript-config` - shared TypeScript settings
- `packages/eslint-config` - shared ESLint flat configs

## Commands

Use the `.cmd` command names on Windows PowerShell if script execution is blocked.

```bash
pnpm.cmd install
pnpm.cmd dev
pnpm.cmd build
pnpm.cmd lint
pnpm.cmd typecheck
```

Run one side only:

```bash
pnpm.cmd dev:client
pnpm.cmd dev:server
```

Local services for the database layer:

```bash
docker compose up -d mongodb redis
```

Seed MongoDB with one admin user, three showcase destinations and starter hotel estimates:

```bash
pnpm.cmd db:seed
```

## Initial Local URLs

- Client: `http://localhost:3000`
- Server: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`
- Sample destination API: `http://localhost:4000/api/destinations`
- Login page: `http://localhost:3000/login`
- Account page: `http://localhost:3000/account`
- Admin gate: `http://localhost:3000/admin`

## Main Packages

- Frontend: `next`, `react`, `react-dom`, `@react-three/fiber`, `@react-three/drei`, `three`, `maplibre-gl`, `framer-motion`, `lucide-react`, `@tanstack/react-query`, `zustand`
- Backend: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/mongoose`, `@nestjs/jwt`, `@nestjs/throttler`, `mongoose`, `cookie-parser`, `helmet`, `zod`
- Tooling: `pnpm`, `turbo`, `typescript`, `eslint`, `prettier`, `vitest`, `tailwindcss`

## Day 2 Database Foundation

MongoDB collections are modeled with Mongoose schemas in `apps/server/src/modules/*/schemas`.

- `users` - normal users and admins
- `destinations` - published/draft travel content, cultural sections, attractions, media and source attribution
- `hotels` - hotel and room estimates for MVP booking simulation
- `itineraries` - user trip plans
- `bookings` - simulated booking records
- `reviews` - destination reviews
- `favourites` - saved destinations per user

## Data Flow

1. Search for a location through a geocoding provider.
2. Enrich it through knowledge, media, place, weather and travel providers.
3. Validate and normalize external responses.
4. Save a draft destination with source and license metadata.
5. Let an administrator verify, edit and publish it.
6. Serve published content from the database/cache instead of repeatedly calling providers.

## Planned Provider Categories

- Geocoding and place search
- Maps and routing
- Wikidata/Wikipedia knowledge
- Wikimedia-compatible media
- Weather
- Flight and hotel offers
- Railway and bus estimates or authorized APIs

The `chatbot` modules are intentionally reserved for a later phase and should answer from verified application data.

## Day 3 Authentication Foundation

Auth is implemented with MongoDB users, bcrypt password hashes and an HttpOnly JWT cookie.

- `POST /api/auth/register` - create a normal user and set the session cookie
- `POST /api/auth/login` - validate credentials and set the session cookie
- `POST /api/auth/logout` - clear the session cookie
- `GET /api/auth/me` - return the current authenticated user
- `GET /api/auth/admin-check` - verify the current user has the `ADMIN` role
- `GET /api/auth/google` - start Google OAuth login
- `GET /api/auth/google/callback` - complete Google OAuth and set the session cookie
- `GET /api/auth/google/status` - check whether Google OAuth environment keys are configured

Public discovery routes stay open. Users only need authentication for personal or protected
features such as account, saved trips, favourites, booking simulation and admin controls.

Seeded local admin credentials:

```text
Email: admin@travelverse.local
Password: Admin@12345
```

Frontend auth routes:

- `/login`
- `/register`
- `/account`
- `/admin`

To enable Google login locally, create OAuth credentials in Google Cloud Console and use this
authorized redirect URI:

```text
http://localhost:4000/api/auth/google/callback
```

Then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
