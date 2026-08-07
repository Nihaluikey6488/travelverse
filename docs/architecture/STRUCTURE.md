# Project structure

```text
finalProject/
|-- apps/
|   |-- client/                    # Next.js TypeScript application
|   |   |-- src/
|   |   |   |-- app/              # route groups and pages
|   |   |   |-- components/       # UI, layout, maps and 3D
|   |   |   |-- features/         # frontend domain modules
|   |   |   |-- services/         # typed API client
|   |   |   `-- lib/              # frontend utilities
|   |   |-- public/               # images, GLB models and textures
|   |   `-- tests/                 # client unit and browser tests
|   `-- server/                    # NestJS TypeScript application
|       |-- src/
|       |   |-- modules/           # business modules by domain
|       |   |-- providers/         # external API adapters
|       |   |-- common/            # shared NestJS infrastructure
|       |   |-- ingestion/         # import and normalization pipeline
|       |   |-- jobs/              # refresh and maintenance jobs
|       |   |-- database/          # database infrastructure
|       |   `-- security/          # rate limits and audit support
|       |-- src/database/          # MongoDB/Mongoose connection and seed scripts
|       `-- tests/                 # API unit, integration and E2E tests
|-- packages/
|   |-- contracts/                 # shared Zod schemas and TS types
|   |-- eslint-config/             # shared linting rules
|   `-- typescript-config/         # shared TypeScript configs
|-- docs/
|   |-- architecture/
|   |-- api/
|   `-- data-sources/
`-- scripts/
```

The client never accesses the database or secret third-party credentials. It communicates only with the server API using contracts from `packages/contracts`.

Folders should gain files only when their feature is implemented. Avoid creating abstractions before they have a concrete use.
