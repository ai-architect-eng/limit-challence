# Submission Tracker

A read-only workspace for operations managers to review broker-submitted opportunities. The
implementation pairs a Django REST Framework API with a Next.js frontend built with React,
TypeScript, and Material UI.

## What you can do

- Browse paginated submissions with company details, broker, owner, status, priority, document and
  note counts, and the latest note preview.
- Combine status, broker, and company-name filters. Apply commits the filters to the URL and returns
  to page one; Reset clears them. Reload and browser history restore the applied state.
- Open a submission's summary, contacts, documents, and notes, then return to the same filtered list
  and page.
- Recover from API failures with retry controls. Empty results, missing records, and invalid IDs
  have separate messages.

The workspace uses responsive card layouts, labeled controls, visible keyboard focus, and wrapping
for long content. Document links accept only HTTP or HTTPS URLs.

## Run locally

Prerequisites: Python 3.12, Node.js 24.x, and npm. Install dependencies and start the two services in
separate terminals. Both sets of commands below start from the repository root.

### Backend

```bash
cd frontend_focused/backend
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_submissions
.venv/bin/python manage.py runserver 127.0.0.1:8000
```

The seed command creates 25 submissions with related contacts, documents, and notes. It skips
seeding if submissions already exist. `seed_submissions --force` deletes existing submission data
and rebuilds the sample dataset.

### Frontend

```bash
cd frontend_focused/frontend
npm ci
npm run dev
```

Open [http://localhost:3000/submissions](http://localhost:3000/submissions). The home page redirects
to this workspace.

The frontend defaults to `http://localhost:8000/api`. To use another API, set
`API_BASE_URL=http://your-api-host:8000/api` in `frontend_focused/frontend/.env.local`. Server
requests read this setting at runtime. `NEXT_PUBLIC_API_BASE_URL` is a compatibility fallback,
followed by the localhost default; Next.js embeds the public variable at build time.

Dependency installation and Playwright browser downloads require network access. A clean frontend
build may also download Geist fonts through `next/font/google`.

## Approach

The existing Django models define brokers, companies, internal owners, submissions, contacts,
documents, and notes. The API keeps those models unchanged and exposes separate list and detail
serializers with camelCase JSON fields. The list joins company, broker, and owner data, aggregates
distinct document and note counts, and selects the latest note without per-row queries. The detail
endpoint prefetches related collections. Submissions use newest-first timestamp and ID ordering for
stable pagination.

The frontend uses the URL as the source of truth for applied filters and pagination. Filter inputs
keep a local draft until Apply. Async server pages fetch uncached API data before rendering; client
components handle forms, navigation, and retries. The list fetches submissions and broker options
in parallel, and a broker failure does not hide submission results.

Detail links carry the applied list URL in `returnTo`. The back link accepts only the local
`/submissions` path, so an arbitrary return URL cannot send the user to another site.

## API

- `GET /api/submissions/`: paginated list with `count`, `next`, `previous`, and `results`. Each page
  contains up to 10 records, including company, broker, owner, related counts, and a latest-note
  preview.
- `GET /api/submissions/<id>/`: full submission with contacts, documents, and newest-first notes.
- `GET /api/brokers/`: unpaginated broker array ordered by name and ID.

List query parameters:

- `status`: `new`, `in_review`, `closed`, or `lost`.
- `brokerId`: a positive integer broker ID.
- `companySearch`: case-insensitive substring search on the legal company name.
- `page`: page number, starting at 1.

Filters combine with AND. Invalid status or broker values return HTTP 400; missing submissions and
out-of-range pages return HTTP 404. The endpoints do not support writes.

## Verification

Run backend checks from `frontend_focused/backend`:

```bash
.venv/bin/python manage.py test submissions -v 2
.venv/bin/python manage.py check
.venv/bin/python manage.py makemigrations --check --dry-run
```

Run frontend checks from `frontend_focused/frontend` after installing dependencies:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Backend tests cover response contracts, combined filters, validation, pagination, related data,
and query counts. Frontend tests cover URL state, server pages, components, and navigation helpers.
See the [frontend README](frontend/README.md#browser-tests) for mock-backed browser tests and the
live workflow suite against the real seeded API, including video recording.

## Tradeoffs and limitations

- Explicit Apply avoids a request on every keystroke and keeps browser history useful.
- Server pages wait for the API before rendering. There are no loading screens or skeletons; during
  client navigation, the current page remains visible until the next page is ready.
- Notes form a newest-first timeline, not nested threads, because the supplied model has no
  parent-note relationship.
- Documents are external references, not uploads. Seeded URLs are illustrative and may not resolve.
- Optional date, document-presence, and note-presence filters are not implemented.
- Authentication, editing, and deployment are outside this local demonstration. Django retains
  development settings, including debug mode, a development secret, permissive CORS, and SQLite;
  this configuration is not suitable for production.

## Project structure

- [`backend/`](backend/): Django models, API views, serializers, filters, seed command, and API tests.
- [`frontend/`](frontend/README.md): Next.js routes, workspace components, API integration, and
  frontend test instructions.
