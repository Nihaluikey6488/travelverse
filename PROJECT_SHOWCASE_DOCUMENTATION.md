# TravelVerse 3D - Project Documentation

## 1. Project overview and purpose

TravelVerse 3D is an immersive travel discovery and planning platform that helps users decide where they should go for a holiday and understand that destination in one place.

The core idea is simple: instead of opening multiple tabs for maps, YouTube travel vlogs, history articles, hotel pages, route estimates and food recommendations, a user can explore a destination through one guided experience.

The platform focuses on:

- discovering beautiful places,
- understanding their history and culture,
- checking famous food, dance, festivals and attractions,
- planning routes and estimated costs,
- exploring hotels and trip plans,
- and saving or simulating bookings after login.

The purpose of this project is to help users save time while planning a trip by bringing destination discovery, history, culture, routes, costs, hotels and source-backed travel information into one platform instead of making them search across multiple websites.

Most travel data in the platform is designed to come from external providers/APIs such as map, knowledge, media and routing services. Admins can review that imported data, edit it, add missing details manually and decide what should be published for users.

## 2. Key features

### Public exploration

Users can browse and explore destinations without authentication. Login is required only for personal actions like saving favourites, planning trips or creating simulated bookings.

### Destination discovery

Users can search and filter destinations, then open detailed pages containing:

- history and cultural story,
- famous food,
- dance and art forms,
- festivals,
- attractions,
- gallery/media,
- estimated daily budget,
- best season,
- and source trust information.

### 3D and animated experience

The homepage includes a signature 3D travel experience with animated UX. Heavy 3D content is loaded carefully so the page remains smooth and does not block normal browsing.

### Maps and route planning

Destination pages include route planning with:

- current/manual location support,
- travel mode selection,
- distance and duration estimate,
- live route provider support,
- and fallback estimated routing when the provider is unavailable.

### Transport and cost comparison

The platform compares estimated travel options and gives users an approximate idea of cost, duration, confidence and route suitability.

### Hotels, itinerary and booking simulation

Users can plan a trip, choose available hotel rooms, calculate estimated totals and create simulated bookings. This is useful for demo and portfolio purposes without handling real payments yet.

### Admin destination management

Admins can:

- create destination drafts,
- import destination data from external providers,
- preview imported content,
- edit and verify source attribution,
- manually add or correct history, food, culture, routes, media and practical travel notes,
- publish destinations,
- or archive outdated content.

This means the platform is not dependent only on fixed hardcoded data. External providers supply the base data, and the admin panel gives control to improve, correct and publish it responsibly.

### Authentication

The project supports credential-based authentication and Google OAuth. Sessions are handled using secure HttpOnly cookies.

### Production readiness

The app includes health checks, structured logs, provider request guardrails, source attribution pages, tests and production deployment documentation.

### Chatbot travel assistant

A chatbot assistant is planned as the next intelligent layer of TravelVerse. It will help users find their favourite place by asking simple questions like:

- what type of holiday they want,
- their budget,
- travel month or season,
- preferred activities,
- food/culture interests,
- trip duration,
- and whether they want beaches, mountains, history, nightlife, spiritual places or adventure.

Based on these answers, the chatbot can suggest suitable destinations from verified TravelVerse data. It can also explain why a place fits the user, what they can do there, what food or culture is famous, and which route or cost estimate they should check next.

The goal is not to make the chatbot guess randomly from the internet. It should answer from verified destination data, external source attribution and admin-reviewed content already available inside TravelVerse.

## 3. Tech stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Three.js with React Three Fiber and Drei
- MapLibre
- TanStack Query
- Zustand

### Backend

- NestJS
- TypeScript
- MongoDB
- Mongoose
- JWT authentication with HttpOnly cookies
- Google OAuth
- Zod validation with shared contracts

### External data and provider layer

- OpenStreetMap Nominatim for place/geocoding search
- Wikimedia/Wikipedia REST APIs for knowledge and media enrichment
- OSRM for route estimation

All imported external data is expected to keep source attribution. If an admin adds or changes content manually, it is still tracked as admin-curated content so users can understand where the information came from.

### Testing and tooling

- pnpm workspace
- Turbo monorepo
- Vitest
- Playwright
- ESLint
- Prettier

## 4. How it works

TravelVerse is built as a modern client-server application.

1. The user opens the client application and can explore public pages without login.
2. The frontend calls the backend API for destination data, filters, route estimates, hotels, transport comparison and trip planning.
3. The backend stores verified application data in MongoDB.
4. Destination base data can come from external providers such as Nominatim, Wikimedia and routing APIs.
5. Admins can import this external data, or manually add a destination if they want more control.
6. Imported data is not published directly. It first becomes a draft.
7. The admin reviews the draft, checks source attribution, edits missing details and then publishes it.
8. Published destinations become visible to normal users on the explore and detail pages.
9. If a user wants personal features like favourites, itinerary history or booking simulation, the app asks them to login.
10. Route and provider calls are cached or guarded to reduce unnecessary external API usage.
11. In a later phase, the chatbot will use verified TravelVerse data to recommend destinations based on user preferences.
12. Health checks and logs help monitor the application in production.

High-level flow:

```text
User
  -> Next.js Client
  -> NestJS API
  -> MongoDB
  -> External Providers
       - Nominatim
       - Wikimedia
       - OSRM
```

Admin content flow:

```text
Search place online
  -> Preview imported data
  -> Save as draft
  -> Review, edit or manually add missing details
  -> Publish
  -> Visible to users
```

Chatbot recommendation flow:

```text
User asks where to go
  -> Chatbot asks preference questions
  -> Matches answers with verified destinations
  -> Suggests best-fit places
  -> Guides user to routes, costs, hotels and destination details
```

## 5. Current progress

The project is currently in active development and already has a working MVP foundation.

Completed so far:

- monorepo setup with separate client and server,
- MongoDB database models,
- authentication and Google OAuth setup,
- public destination discovery,
- admin destination management,
- external destination import pipeline,
- source attribution and internal source explainer pages,
- admin controls to edit imported data or add manually curated content,
- destination detail pages with culture, food, history and attraction data,
- route planning with provider fallback,
- optimized 3D homepage experience,
- transport comparison and cost estimation,
- hotels, itinerary and simulated booking flow,
- production health/readiness endpoints,
- structured logging and provider quota guardrails,
- API integration tests,
- client E2E testing setup,
- accessibility and performance improvements,
- and production deployment documentation.

Planned chatbot progress:

- chatbot will help users decide where to travel,
- recommendations will be based on budget, mood, season and interests,
- chatbot answers should come from verified platform data,
- and it will guide users toward destination pages, route planning, cost comparison and trip planning.

Current local verification:

```bash
pnpm.cmd test
pnpm.cmd lint
pnpm.cmd typecheck
pnpm.cmd build
```

All major checks are passing locally.

## 6. Next planned improvements

- Deploy the client and server on production hosting.
- Add real production MongoDB credentials and backup monitoring.
- Add more destinations from verified sources.
- Improve 3D visuals and micro-interactions.
- Add screenshots and a short demo video.
- Add chatbot support later so users can ask destination-specific questions from verified TravelVerse data.
- Use chatbot recommendations to help users find their favourite destination faster.
- Integrate real booking/transport providers in a future version.

## Short conclusion

TravelVerse 3D is not just a travel listing website. It is designed to become a guided travel decision platform where users can discover a destination, understand its beauty, check practical planning details and move from curiosity to a clear trip plan.
