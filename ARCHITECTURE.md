# Project structure and maintenance

SCELE Tracker reuses the original message board's UI CAS authentication approach,
not its profile, messaging, avatar or database features. Git history and the MIT
license remain for attribution; obsolete application modules have been removed.

## Frontend

- `ui/src/App.tsx`: application providers and router bootstrap only.
- `ui/src/components/AppLayout.tsx`: authentication gate and route composition.
- `ui/src/components/SiteHeader.tsx`, `SiteFooter.tsx`: shared page chrome.
- `ui/src/components/ActivityCard.tsx`: activity feed presentation.
- `ui/src/pages/`: DashboardPage, ActivityDetailsPage, AdminPage and SignInPage.
  Page-specific state and markup stay with their page. Extract a component when
  it is reused or when a distinct responsibility makes a page hard to read.
- `ui/src/context/AuthContext.tsx`: session discovery and local logout state.
- `ui/src/model.ts`: public API types, fetching and deadline formatting.
- `ui/src/index.css`: Tailwind import and shared component classes. There is no
  CSS Modules stylesheet or dependency on the message-board styles.

## Backend and trust boundaries

- `core/src/app.ts`: API routing, authentication gates and public projections.
  Public IDs use a keyed HMAC to hide source aliases while preserving account
  variants. Changing the session secret invalidates both sessions and old links.
- `core/src/tracker/auth.ts`: CAS callback validation and session cookies.
  Browser-bound state prevents login CSRF; CAS tickets are validated server-side.
- `roles.ts`: live users.json policy. Roles are not trusted from JWT claims;
  policy failures grant no administrative access.
- `accounts.ts`: private configuration validation. Credentials never cross the
  public API boundary and must not appear in logs or test fixtures.
- `moodle.ts`: isolated session transport, token transport, and metadata parsing.
  Account-specific deadlines are not collapsed. Calendar coverage and adapter
  limitations are documented in README.md; no activity submission is performed.
- `store.ts`: ten-minute persistent SQLite snapshot cache and shared in-flight synchronization.
  Concurrent visitors await the same sync instead of creating duplicate requests.
- `index.ts`: startup and production frontend serving; `env.ts` loads environment.

## Changes and verification

Run `pnpm format`, `pnpm format:check`, `pnpm build`, and `pnpm test`.
Prettier handles indentation, multiline JSX and consistent source formatting.
Add comments for security boundaries, unusual date handling and concurrency;
avoid comments which merely paraphrase a component's name or JSX.

Tests are in `tests/` (API/authentication, roles/privacy and React rendering).
Browser verification must use desktop and mobile widths; synthetic fixtures are
only browser-test responses and never an authentication bypass in production.
Preserve deployed `.env`, `config/accounts.json`, `config/users.json` and runtime
UID settings when updating the service. No private configuration belongs in Git.

`cache.ts` owns SQLite storage; `store.ts` owns freshness and retry policy. No background timer runs on the server. Dashboard polling is scoped to document visibility and cleaned up on unmount.
