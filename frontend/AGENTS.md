# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# Frontend agent guide

This directory is the Next.js 16.3.8 / React 19.2.4 Submission Tracker frontend. It calls the sibling Django API; the repository-root `../../README.md` is the source for the challenge brief and full backend setup.

## Dev environment

- Use Node 24.16.0 or a compatible newer Node 24.x. Install dependencies with `npm ci` (the root workflow uses npm, and both `package-lock.json` and `pnpm-lock.yaml` are present).
- Optional local env setup: `cp .env.example .env.local`. The API defaults to `http://localhost:8000/api`; `API_BASE_URL` overrides server requests, with `NEXT_PUBLIC_API_BASE_URL` as fallback. Run the Django backend on port 8000 for manual frontend development; see `../../README.md` for backend installation, migration, and seed commands.
- Start the frontend with `npm run dev`; the workspace is at `http://localhost:3000/submissions`.

## Build and test

Run these from this directory; scripts are defined in `package.json`:

- `npm run build`
- `npm run start`
- `npm run lint` (ESLint; Prettier violations are errors)
- `npm run format` (Prettier check, not a formatter write)
- `npm test` (Vitest)
- `npm run typecheck` (`next typegen && tsc --noEmit`)
- `npx playwright install chromium ffmpeg` (browser and video dependencies)
- `npm run test:e2e` (mock API on port 8010 and Next dev server on port 3001)
- `npm run test:e2e:live` (live Django API on port 8001 and production frontend on port 3002; run `npm run build` first)

For the live suite, use `PLAYWRIGHT_USE_SYSTEM_CHROME=1 SUBMISSION_TRACKER_DB=/absolute/path/to/fresh.sqlite3 npm run test:e2e:live`, replacing the example with a fresh dedicated absolute database path. The suite migrates and seeds that database; do not point it at the normal development database. Use `PLAYWRIGHT_USE_SYSTEM_CHROME=1` with `npm run test:e2e` too when using installed Chrome instead of Playwright's bundled browser.

## Code layout and conventions

- `app/` owns App Router layouts and routes: `/submissions` and `/submissions/[id]`. These pages are async server components; Next 16 `params` and `searchParams` are promises.
- `lib/server/submissions.ts` performs uncached server-side API reads. `lib/submission-filters.ts` parses and serializes URL filter state. The list/detail page data flow is server-rendered; the client components in `app/submissions/` and `components/submissions/` handle interaction and navigation.
- `lib/types.ts` contains the camelCase API response types; `lib/hooks/` retains React Query hooks, but the current list/detail pages do not use them for initial fetching.
- Use the configured `@/*` alias for imports from the frontend root. Unit tests are in `tests/` (Vitest + jsdom); browser tests are in `tests/e2e/` and `tests/live/` (Playwright).

## Pitfalls

- The two lockfiles can suggest different package managers; follow the documented `npm ci` workflow and avoid switching package managers or regenerating lockfiles during unrelated work.
- Mock-backed Playwright tests use port 3001 and port 8010; live tests use 3002 and 8001. The Playwright configs start these servers themselves and refuse to reuse existing servers.
- A clean install and Playwright browser/video downloads need network access. A clean Next build may also fetch Geist through the existing `next/font/google` import.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
