# Submission Tracker frontend

Next.js 16, React 19, TypeScript, and Material UI power the submission review workspace. See the
[project README](../README.md) for backend setup, the API contract, and implementation tradeoffs.

## Run locally

Start the Django API using the project instructions, then run these commands from this directory
with Node.js 24.x and npm:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000/submissions](http://localhost:3000/submissions). `/` redirects to the list;
`/submissions/[id]` shows a submission's details.

For a production build:

```bash
npm run build
npm run start
```

Dependency installation requires network access. A clean build may also download the Geist fonts.

## API configuration

Server requests resolve the API base URL in this order:

1. `API_BASE_URL`, read at runtime.
2. `NEXT_PUBLIC_API_BASE_URL`, embedded by Next.js at build time.
3. `http://localhost:8000/api`.

To override the default, create `.env.local` with:

```dotenv
API_BASE_URL=http://localhost:8000/api
```

The base URL includes `/api`. The supplied `.env.example` uses the public fallback for compatibility
with the retained client hooks; copying it is optional for local development.

## Workspace behavior

The list stores applied `status`, `brokerId`, `companySearch`, and `page` values in the URL. Filter
inputs stay local until Apply, which resets pagination. Reset clears the filters, and reload or
browser history restores the applied state. Detail links preserve the list URL in `returnTo`; the
back link validates it before navigation.

Server pages fetch list, broker, and detail data with `cache: 'no-store'`. Initial HTML contains data
or an error state rather than a loading screen. Client navigation retains the current page while
the next server page is prepared. Retry controls refresh server data. A broker-options failure
disables the broker selector without hiding the submission list or clearing an applied broker.

The detail view has summary, contact, document, and note sections, including fallbacks for missing
content. It distinguishes invalid IDs, missing submissions, and API failures. Document URLs must
use HTTP or HTTPS; other values render as text without a link.

## Code organization

- `app/submissions/`: async server pages and client workspace components for list and detail views.
- `components/submissions/`: cards, filters, pagination, status labels, and shared layout sections.
- `lib/server/submissions.ts`: server-side API requests and success/error results.
- `lib/submission-filters.ts`: URL parsing and list URL construction.
- `lib/detail-navigation.ts`: safe return paths and document URLs.
- `lib/types.ts`: API response types.
- `styles/theme.ts` and `app/providers.tsx`: Material UI theme and shared providers.
- `tests/`: unit/component tests, mock-backed browser tests, and live integration tests.

TanStack Query hooks and the Axios client remain from the scaffold, with a shared query provider.
The list and detail pages use server fetching instead of those hooks.

## Checks

Run from this directory after `npm ci`:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Vitest and React Testing Library cover filter state, server pages, components, API hooks, date
formatting, and safe navigation. These checks do not require a running Django server.

### Browser tests

Install the browser and video dependencies once:

```bash
npx playwright install chromium ffmpeg
```

Run the mock-backed suite:

```bash
npm run test:e2e
```

Playwright starts a mock API on port 8010 and the development frontend on port 3001. The tests cover
filter combinations, history and reload, pagination, retries, empty and missing states, server
rendering, keyboard interaction, and long-content layouts.

Run the live suite after setting up the backend virtual environment:

```bash
npm run build
SUBMISSION_TRACKER_DB="$PWD/.e2e-submissions.sqlite3" npm run test:e2e:live
```

Build immediately before the live suite, particularly after mock-backed tests, which run the dev
server. The live suite starts the production frontend on port 3002 and Django on port 8001. It
migrates and seeds the database named by `SUBMISSION_TRACKER_DB`, leaving the normal development
database untouched. Choose a new, dedicated database filename for a fresh run; if the variable is
omitted, the suite uses `.e2e.sqlite3` in this directory.

Live tests compare visible results with the real API and exercise browsing, combined filters,
pagination, detail navigation, preserved return state, a missing submission, and a mobile layout.
They record videos under `test-results/` and retain traces on failure. Recordings are local test
artifacts, not hosted demo links.

To use installed Google Chrome instead of bundled Chromium, prefix either browser-test command
with `PLAYWRIGHT_USE_SYSTEM_CHROME=1`. Live video recording still requires Playwright's FFmpeg
download. Keep ports 3001, 3002, 8001, and 8010 free for the corresponding suites.
