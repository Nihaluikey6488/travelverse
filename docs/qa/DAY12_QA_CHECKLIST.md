# Day 12 QA checklist

Use this checklist before opening the Day 12 PR.

## Automated checks

- `pnpm.cmd test`
- `pnpm.cmd lint`
- `pnpm.cmd typecheck`
- `pnpm.cmd build`
- `pnpm.cmd --filter @travelverse/client test:e2e` after Playwright browser binaries are installed
  and the client is running on `http://localhost:3100`.

## Critical workflow coverage

- Auth API: register/login validation, session cookie and admin role guard.
- Public discovery API: published destination listing, query parsing and invalid slug handling.
- Booking API: authenticated ownership, booking creation payload and invalid date rejection.

## Manual accessibility checks

- Keyboard-only flow:
  - Tab from the browser top into the skip link.
  - Open Home, Explore, Destination detail, Transport, Trip Planner and Admin pages.
  - Every button/link/input/select should show a visible focus ring.
- Reduced motion:
  - Enable OS/browser `prefers-reduced-motion`.
  - Home page should show the smooth non-WebGL experience unless user explicitly launches 3D.
- Geolocation denied:
  - Open a destination detail page.
  - Deny location permission.
  - Route planner should keep presets/manual origin available and show a polite status message.

## Responsive layout checks

- Phone: 390px width.
- Tablet: 768px width.
- Desktop: 1440px width.

Check Home, Explore, Destination detail, Transport and Trip Planner for overflow, clipped controls,
unreadable text and inaccessible hover-only states.

## Performance budget

- 3D globe must stay lazy-loaded behind the "Launch 3D Earth" button.
- Reduced-motion, mobile/coarse pointer, slow connection, save-data or low-memory hints must use the
  fallback scene.
- WebGL scene should keep DPR capped and use the balanced destination count when not in full mode.
- Production build should complete successfully before the branch is pushed.

## Playwright note

Playwright specs now cover the main user journey and admin publish UI journey with mocked API
responses. If browsers are missing locally, run:

```powershell
pnpm.cmd --filter @travelverse/client exec playwright install chromium
```

Then start the client test server in one terminal:

```powershell
cd apps/client
pnpm.cmd exec next dev --port 3100
```

In another terminal:

```powershell
pnpm.cmd --filter @travelverse/client test:e2e
```
