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

## Initial Local URLs

- Client: `http://localhost:3000`
- Server: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`
- Sample destination API: `http://localhost:4000/api/destinations`

## Main Packages

- Frontend: `next`, `react`, `react-dom`, `@react-three/fiber`, `@react-three/drei`, `three`, `maplibre-gl`, `framer-motion`, `lucide-react`, `@tanstack/react-query`, `zustand`
- Backend: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/mongoose`, `mongoose`, `helmet`, `zod`
- Tooling: `pnpm`, `turbo`, `typescript`, `eslint`, `prettier`, `vitest`, `tailwindcss`

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
