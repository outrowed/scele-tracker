# SCELE Tracker

A modern course activity tracker and calendar dashboard for students at the Faculty of Computer Science, Universitas Indonesia (Fasilkom UI). It aggregates assignments, quizzes, and deadlines from [SCeLE](https://scele.cs.ui.ac.id) into a single, real-time dashboard and monthly calendar view.

The service is only accessible by authenticated users from Universitas Indonesia Central Authentication Service (UI CAS2 SSO). In short, it's only ever designed for UI students who have UI SSO accounts.

## Features

- **Centralized Activity Feed:** View all upcoming assignments and quizzes across enrolled courses, sorted by urgency. Filter by status (upcoming, past, undated), activity type (assignments vs. quizzes), or specific course.
- **Monthly Course Calendar:** Interactive monthly calendar view plotting activity openings, due dates, and cut-off deadlines with course filtering and quick detail previews.
- **Multi-Account Moodle Synchronization:** Server-side synchronization using configurable Moodle source accounts with isolated session cookies. Supports both student web session emulation and Moodle REST API tokens.
- **Privacy & Security by Design:** 
  - **Zero credential exposure:** Student credentials and session cookies are never exposed to clients, stored in source control, or logged.
  - **No private user data stored:** Only general course metadata, activity descriptions, and deadlines are cached. No grades, personal submissions, roster lists, or quiz answers are ever accessed or stored.
  - **Opaque Activity IDs:** External links and activity references use server-keyed HMAC tokens to prevent leaking internal database IDs or upstream source aliases.
- **Persistent Shared Cache:** Powered by a local SQLite cache (WAL mode). Serves instant responses with a 10-minute stale-while-revalidate background refresh cycle to keep upstream Moodle load minimal.
- **Visibility-Aware Polling:** Client dashboards automatically pause background polling when tabs are inactive or minimized, conserving client battery and server resources.
- **Administration Control:** Built-in diagnostics view (`/admin`) for designated administrators to inspect source health and cache status.

## Getting started

### Prerequisites

- **Node.js** >= 22.0.0
- **pnpm** >= 10.0.0

### Quick start

1. **Clone the repository:**
   ```sh
   git clone https://github.com/outrowed/scele-tracker.git
   cd scele-tracker
   ```

2. **Install dependencies:**
   ```sh
   pnpm install
   ```

3. **Configure the environment:**
   Copy the example environment file:
   ```sh
   cp env.example .env
   ```
   For local development, sensible defaults are provided in `env.example`. A temporary JWT signing secret is automatically generated when running in development if none is specified.

4. **Configure Moodle accounts:**
   Copy the example accounts configuration:
   ```sh
   cp config/accounts.example.json config/accounts.json
   ```
   Add your SCeLE credentials or token (see [Account Configuration](#account-configuration)).

5. **Start development servers:**
   ```sh
   pnpm dev
   ```
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:3001

## Development

The project is structured as a pnpm workspace monorepo consisting of the backend API (`core/`) and the frontend single-page application (`ui/`).

### Local development workflow

Running `pnpm dev` starts both development servers concurrently:

- **Vite Dev Server (Frontend):** Runs at `http://localhost:5173` with instant Hot Module Replacement (HMR). Any changes in `ui/src/` reflect immediately in the browser without losing application state.
- **Express API Server (Backend):** Runs at `http://localhost:3001`. Vite automatically proxies `/api` calls from `http://localhost:5173/api` to `http://localhost:3001/api`, avoiding CORS configuration during development.
- **Debugging & Inspection:** Standard browser developer tools can be used to inspect network requests, DOM structure, and React components. Backend request logs and sync outputs stream directly to your terminal console.

### Testing

The project maintains automated test suites covering API endpoints, CAS authentication, token transport, calendar date mathematics, and UI components:

```sh
# Run Vitest test suite
NODE_ENV=test pnpm test

# Check code formatting with Prettier
pnpm format:check

# Format codebase
pnpm format

# Verify TypeScript compilation and production builds
pnpm build
```

- **Vitest:** Fast, Vite-native test runner executing unit and integration tests across server routes, caching policies, and utilities.
- **React Testing Library & JSDOM:** Simulates browser environments and verifies UI interactions, navigation, and accessibility standards without relying on full end-to-end browser overhead.
- **Prettier:** Enforces uniform code formatting across all TypeScript, TSX, and CSS files.

## Configuration

### Account configuration

Moodle source accounts are configured in `config/accounts.json`. This file must be kept private (mode `0600`) and should never be committed to source control.

```json
{
  "accounts": [
    {
      "id": "source-1",
      "mode": "session",
      "username": "YOUR_SSO_USERNAME",
      "password": "YOUR_SSO_PASSWORD"
    },
    {
      "id": "source-2",
      "mode": "token",
      "token": "YOUR_MOODLE_REST_TOKEN"
    }
  ]
}
```

#### Authentication modes

- **`session` (Default):**
  Emulates the standard student login flow using `cheerio` and `tough-cookie`. Discovers enrolled courses and queries Moodle's authenticated AJAX calendar endpoints without requiring administrative web service tokens. Sessions are reused across syncs and refreshed automatically on expiry.
- **`token` (Optional):**
  Connects directly to Moodle REST Web Services using user-scoped access tokens via a secure POST-only transport.

*Note: Use neutral public identifiers for `id` (e.g., `source-1`, `source-2`), as source IDs appear in administrative diagnostics.*

### Administration control

Administrative access to the `/admin` diagnostic dashboard is governed by `config/users.json`:

```json
{
  "users": [
    { "username": "exact.sso.username", "role": "admin" },
    { "username": "student.username", "role": "user" }
  ]
}
```

- Roles are matched strictly and case-sensitively against the verified UI CAS SSO username.
- If unlisted or if the file is absent, visitors default to regular user privileges.
- Changes take effect immediately on subsequent requests without restarting the server.

### Environment variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port for the backend Express server | `3001` |
| `APP_URL` | Public origin used for browser redirects and CAS callback validation | `http://localhost:5173` (dev) |
| `JWT_SECRET` | Secret key for signing session tokens (min. 32 chars in production) | Generated in dev |
| `COOKIE_SECURE` | Enforce `Secure` attribute on cookies (`true` in production) | `false` |
| `MOODLE_ACCOUNTS_FILE` | Path to the private Moodle accounts JSON file | `./config/accounts.json` |
| `USERS_FILE` | Path to the role configuration JSON file | `./config/users.json` |
| `CACHE_DB_PATH` | Path to the SQLite persistent cache file | `./data/cache.sqlite` |
| `NODE_ENV` | Runtime environment (`development` or `production`) | `development` |

## Deployment

### Docker Compose

A ready-to-use `compose.yml` is provided for containerized deployments.

1. **Prepare configuration and environment:**
   ```sh
   cp env.example .env
   # Edit .env with production APP_URL (e.g. https://tracker.example.com) and a strong JWT_SECRET
   ```

2. **Ensure persistent storage directories exist:**
   ```sh
   mkdir -p data config
   chmod 700 data config
   ```

3. **Deploy using Docker Compose:**
   ```sh
   docker compose up -d --build
   ```

### Reverse proxy & SSL

In production, place the application container behind an HTTPS reverse proxy (such as Caddy, Nginx, or Traefik) that terminates SSL and forwards requests to the application server (`3001` by default).

Ensure the reverse proxy passes standard forwarding headers (`X-Forwarded-For`, `X-Forwarded-Proto`, and `Host`) and that `APP_URL` in `.env` matches your external HTTPS domain so UI CAS SSO callbacks resolve correctly.

## Technology stack

*This is a summary of the technology used in this project. For more details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*

### Runtime & tooling

- **Node.js 22+:** Provides the runtime environment, leveraging modern ECMAScript modules and native standard library capabilities.
- **TypeScript:** Enforces strict static type safety across both frontend and backend codebases.
- **pnpm Workspaces:** Coordinates monorepo dependencies, scripts, and shared tooling across packages without duplication.

### Frontend (`ui/`)

- **React 19:** Powers declarative UI components, managing reactive state for filters, views, and details.
- **Vite 8:** Modern frontend build tool providing fast development startup and instant Hot Module Replacement (HMR).
- **Tailwind CSS 4:** Utility-first CSS engine used for fluid responsive layouts, typography, and theme styling.
- **CSS Modules:** Encapsulates component-specific CSS styles where utility classes alone are insufficient.
- **React Router 7 (`react-router-dom`):** Handles client-side navigation between the dashboard feed, calendar, activity details, and admin views.
- **Lucide React (`lucide-react`):** Supplies clean, consistent SVG iconography throughout the application.

### Backend (`core/`)

- **Express 5:** Minimalist web framework handling API endpoints, CAS authentication tickets, and serving production frontend assets.
- **Node.js Built-in SQLite (`node:sqlite`):** Uses Node's built-in `DatabaseSync` driver in WAL (Write-Ahead Logging) mode to persist cached course activities and sync state without requiring external database servers or native binary rebuilds.
- **Cheerio & Tough-Cookie:** Automates student web session authentication, maintaining isolated cookie jars and parsing Moodle HTML/AJAX calendar endpoints.
- **JSON Web Tokens (`jsonwebtoken`):** Issues cryptographically signed, stateless session cookies (`HttpOnly`, `SameSite=Lax`) to authenticated users.
- **Fast-XML-Parser:** Parses CAS 2.0 XML service responses returned by Universitas Indonesia's SSO identity provider.
- **`@didactika/moodle-client`:** Interacts with official Moodle REST Web Services when token-based authentication mode is configured.

### Deployment & containers

- **Docker & Docker Compose:** Packages the service into an unprivileged, multi-stage container image with a read-only root filesystem for secure production hosting.

## License

This project is licensed under the [MIT License](LICENSE).
Attribution and upstream commit history from [UI SSO Message Board](https://github.com/outrowed/ui-sso-message-board) are retained.
