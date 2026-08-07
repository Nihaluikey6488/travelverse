# TravelVerse 3D — Day-Wise Work Plan

## Delivery target

Build a production-ready MVP in **12 development days**, followed by **2 modification and release days**.

The MVP will support approximately 100 users and deeply showcase 3–5 destinations. It will not attempt to reproduce every Google Maps or booking feature.

## Confirmed architecture

- **Frontend:** React through Next.js, TypeScript, Tailwind CSS, React Three Fiber and Framer Motion/GSAP
- **Backend:** Node.js, NestJS and TypeScript
- **Database:** MongoDB with Mongoose
- **Shared contracts:** Zod schemas and inferred TypeScript types in `packages/contracts`
- **Maps:** Mapbox or Leaflet with an approved geocoding/routing provider
- **External content:** Wikidata, Wikimedia and approved travel-data providers
- **Repository:** TypeScript monorepo

```text
apps/client       React/Next.js frontend and admin interface
apps/server       NestJS TypeScript API and provider integrations
packages/contracts Shared validation schemas and API types
```

## MVP scope

### Must be completed

- User registration, login and profile
- User/admin role-based authorization
- Destination search and discovery
- Rich destination pages covering history, culture, food, dance, festivals and attractions
- 3D landing experience and selected destination visuals
- Map, current location, route, distance and journey duration
- Transport-option comparison with live/estimated labels
- Hotel discovery and booking simulation
- Itinerary and complete trip-cost estimator
- Admin destination import, editing, verification and publishing
- Responsive UI, security checks, tests, deployment and documentation

### Deferred until after the first release

- AI chatbot
- Real payments and ticket issuance
- Voice navigation
- Complete real-time railway and bus inventory
- Hundreds of custom 3D landmarks
- Native mobile application

---

## Day 1 — Initialize the monorepo and freeze the scope

### Root workspace

- Configure a `pnpm` workspace for `apps/*` and `packages/*`.
- Add root scripts for development, builds, linting, type-checking and tests.
- Add shared ESLint, Prettier and TypeScript configuration.
- Add `.gitignore`, `.env.example` and project contribution rules.
- Write the final user stories and acceptance criteria.
- Select 3–5 showcase destinations.
- Decide which data is live, estimated, imported or manually curated.

### `apps/client`

- Initialize Next.js with React, TypeScript and the App Router.
- Add Tailwind CSS and the basic design tokens.
- Add the public, authentication, platform and admin layouts.

### `apps/server`

- Initialize NestJS with strict TypeScript settings.
- Add configuration validation, a health endpoint and structured logging.
- Configure CORS only for the frontend origin.

### Definition of done

- Client and server run locally with one root command.
- Lint and type-check commands pass.
- `/api/health` confirms the API is running.
- No feature outside the written MVP is started.

## Day 2 — Database design and shared contracts

### Backend

- Configure MongoDB and Mongoose.
- Model users, roles, destinations, destination sections, attractions, media, sources, hotels, rooms, itineraries, bookings, reviews and favourites as MongoDB collections.
- Add publishing states: `DRAFT`, `PUBLISHED` and `ARCHIVED`.
- Store source URL, provider, licence, fetched time and verification status for imported content.
- Create MongoDB schemas, indexes and seed an administrator account.

### Shared package

- Add Zod schemas for authentication, pagination, destinations and API errors.
- Export inferred types from `packages/contracts`.
- Do not manually duplicate API types in the client and server.

### Definition of done

- A clean MongoDB database can be connected and seeded.
- MongoDB Compass or a Mongo shell shows valid initial records.
- Client and server can import shared contracts.

## Day 3 — Authentication, authorization and security foundation

### Backend

- Implement registration, login, logout and current-user endpoints.
- Hash passwords securely.
- Use secure HTTP-only cookies or a correctly designed access/refresh-token flow.
- Add authentication and role guards.
- Add request validation, centralized errors and rate limiting.

### Frontend

- Build login and registration forms.
- Add authenticated user state and protected layouts.
- Add loading, validation and failure feedback.
- Protect the admin interface based on server-confirmed roles.

### Tests

- Test successful login, invalid credentials and unauthorized admin access.

### Definition of done

- A user can register, log in and log out.
- A normal user cannot access admin APIs.
- Authentication survives a page refresh.

## Day 4 — Destination APIs and admin content management

### Backend

- Build destination list, detail, create, update, publish and archive operations.
- Add services and repositories inside `apps/server/src/modules/destinations`.
- Add attractions, cultural sections, media and source metadata.
- Implement pagination, filters and safe sorting.

### Frontend

- Build the admin destination list and editor.
- Support history, food, dance, festivals, attractions and travel tips.
- Add draft preview and publish controls.
- Add reusable forms and confirmation dialogs.

### Definition of done

- An administrator can create, edit, preview and publish a destination without changing code.
- Public APIs return only published content.

## Day 5 — External-data ingestion pipeline

### Backend

- Implement provider interfaces for geocoding, knowledge and media.
- Connect one geocoding provider.
- Connect Wikidata/Wikimedia-compatible knowledge and media sources.
- Build the flow: search → select → fetch → normalize → validate → save draft.
- Cache provider results and handle quotas, timeouts and provider failures.
- Preserve attribution and licence metadata.

### Admin frontend

- Build an “Import destination” workflow.
- Display external matches before importing.
- Show imported fields and sources for administrator review.

### Definition of done

- An administrator can import a destination as a draft.
- Imported content never publishes automatically.
- Provider errors do not crash the application.

## Day 6 — Public discovery and rich destination pages

### Frontend

- Build the homepage, explore page and destination search.
- Add filters for category, activity and region.
- Build destination cards, skeletons, empty states and pagination.
- Build the destination detail route at `destinations/[slug]`.
- Add sections for history, culture, food, dance, festivals, attractions, gallery and practical advice.
- Add favourites for authenticated users.

### Backend

- Implement public search and destination-detail endpoints.
- Add indexes for slug, status, name and common filters.

### Definition of done

- Users can search and explore published destinations on desktop and mobile.
- At least three destinations contain complete, verified content.

## Day 7 — Maps, geolocation and routing

### Frontend

- Add the map component under `apps/client/src/components/maps`.
- Request browser location permission with a clear fallback.
- Display user position, destination marker and route polyline.
- Add travel-mode controls and nearby-place markers.

### Backend

- Create a routing-provider interface and connect one provider.
- Normalize distance to kilometres and time to minutes.
- Cache identical route requests for a limited period.
- Keep secret provider credentials on the server.

### Definition of done

- A user can choose origin and destination and see distance, duration and route.
- Denying location permission does not block manual origin entry.

## Day 8 — Signature 3D and animated UX

### Frontend

- Create the 3D globe/hero using React Three Fiber and Drei.
- Add selectable destination markers and animated route arcs.
- Add polished page and scroll transitions.
- Add one or two optimized GLB landmark models.
- Lazy-load 3D scenes and display loading progress.
- Add mobile, low-performance and reduced-motion fallbacks.

### Performance rules

- Compress models and textures.
- Do not load all destination assets at once.
- Keep the navigation and essential content usable without WebGL.

### Definition of done

- The 3D experience enhances discovery without delaying access to essential content.
- The application remains usable on a mid-range mobile device.

## Day 9 — Transport comparison and cost engine

### Backend

- Implement provider contracts for flights, rail, bus and driving estimates.
- Integrate one accessible live/sandbox provider where possible.
- Use transparent admin-configured estimates for unavailable sources.
- Implement cheapest, fastest and recommended comparisons.
- Create a cost engine for transport, accommodation, food, local travel, attraction tickets and taxes.

### Frontend

- Build origin, destination, dates and traveller inputs.
- Display normalized comparison cards.
- Clearly label values as `LIVE`, `SANDBOX` or `ESTIMATED`.
- Show currency, retrieval time and possible extra charges.

### Tests

- Unit-test cost calculations, traveller multiplication, dates and currencies.

### Definition of done

- The user can compare options without estimated values being misrepresented as live prices.

## Day 10 — Hotels, itinerary and booking simulation

### Backend

- Implement hotels, rooms, availability and simulated-booking APIs.
- Prevent invalid date ranges and conflicting room bookings.
- Implement itinerary creation and day-by-day items.
- Combine itinerary choices with the cost engine.

### Frontend

- Build hotel search, details and filters.
- Build check-in, check-out and guest selection.
- Build the itinerary editor and booking confirmation.
- Add saved trips and booking history.

### Definition of done

- A user can plan a trip, select a hotel, calculate the total estimate and create a simulated booking.

## Day 11 — Complete integration and production hardening

### Integration

- Remove temporary hard-coded data from completed features.
- Ensure client requests use the shared API contracts.
- Add consistent loading, empty, error and retry states.
- Verify admin changes appear correctly in public pages.

### Security and reliability

- Validate every backend input.
- Verify authentication, role checks and ownership checks.
- Add secure headers, body-size limits and sanitized uploads.
- Add database constraints and useful indexes.
- Prevent API keys and sensitive errors from reaching the client.
- Add audit logging for important admin actions.

### Definition of done

- The primary user and administrator flows work end to end.
- There are no known critical security or data-integrity issues.

## Day 12 — Testing, accessibility and performance

### Automated testing

- Add backend unit tests for core services.
- Add API integration tests for authentication, destinations and bookings.
- Add Playwright tests for the main user journey and admin publishing journey.
- Run linting, type-checking, tests and production builds.

### Quality testing

- Test phone, tablet and desktop layouts.
- Test keyboard navigation, labels, focus states and colour contrast.
- Test slow networks, failed providers and denied geolocation.
- Measure bundle size and 3D asset loading.
- Fix critical and high-priority defects.

### Definition of done

- Production builds pass for both applications.
- Critical workflows have automated coverage.
- No unresolved critical or high-priority bug remains.

## Day 13 — Deployment, monitoring and documentation

### Deployment

- Provision the production MongoDB database.
- Deploy the client and server independently.
- Configure HTTPS, frontend/API origins, secrets and database seed scripts.
- Configure health checks, structured logs and error monitoring.
- Add API-provider quota and spending limits.
- Seed production-safe showcase content.

### Documentation

- Document local setup and environment variables.
- Document architecture, database model and API endpoints.
- Record external providers, licences, caching rules and attribution.
- Add screenshots and a short demonstration video.

### Definition of done

- A new user can access the deployed application.
- An administrator can manage content in production.
- Another developer can run the repository from its README.

## Day 14 — Modification, release freeze and presentation

### Feedback and fixes

- Collect structured feedback from at least two users.
- Fix confusing navigation, mobile issues and slow interactions.
- Correct destination content and cost explanations.
- Improve the most visible animations without adding a new subsystem.

### Release

- Re-run linting, type checks, tests and builds.
- Verify production logs, health endpoint and database backups.
- Freeze features and create the final release tag.
- Prepare project slides and interview explanations.

### Definition of done

- The deployed release is stable and demo-ready.
- Remaining non-critical work is documented instead of rushed into production.

---

## Daily working routine

Use this routine every day:

1. Review the day's definition of done.
2. Pull or inspect the latest code and confirm the app still starts.
3. Create small tasks for client, server, database and tests.
4. Implement one complete vertical flow before starting another.
5. Validate external input at the backend boundary.
6. Test the feature manually and add important automated tests.
7. Run linting, type-checking and relevant tests.
8. Commit working changes with a meaningful message.
9. Update this document if scope or provider availability changes.

## Scope-control rules

- Finish functionality before adding visual polish.
- Use only 3–5 deeply prepared destinations for the MVP.
- Keep the chatbot disabled until the verified content system is stable.
- Do not scrape arbitrary websites.
- Never claim estimated transport or hotel prices are live.
- Do not add real payments during the initial 14-day schedule.
- Move unfinished optional work to a post-release backlog.

## Final completion checklist

- [ ] Client and server production builds pass
- [ ] MongoDB connection and seed process work
- [ ] Registration, login and logout work
- [ ] Admin authorization is enforced by the server
- [ ] Admin can import, edit and publish destinations
- [ ] Users can search and view rich destination content
- [ ] Maps, location and routing work with fallbacks
- [ ] The 3D experience is optimized and optional
- [ ] Transport values have correct live/estimated labels
- [ ] Trip-cost calculations are tested
- [ ] Hotel and itinerary flows work
- [ ] Mobile and keyboard navigation are usable
- [ ] Provider attribution and licences are displayed
- [ ] Secrets remain on the server
- [ ] Monitoring and health checks are active
- [ ] README, API and architecture documentation are complete
- [ ] Public deployment and demonstration video are ready
