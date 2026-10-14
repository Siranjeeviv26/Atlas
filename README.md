# Atlas — travel discovery & trip planning

Phase 1 of a full-stack travel platform: a Hapi/TypeScript API, a Supabase
PostgreSQL database, and a Next.js frontend. Users browse destinations and
packages, save favourites, and send trip enquiries; admins manage content and
image uploads.

```
backend/    Hapi 21 + TypeScript + Drizzle ORM + Better Auth
frontend/   Next.js 16 (App Router) + Tailwind v4 + TanStack Query + Motion
```

---

## Quick start

```bash
npm install                       # workspaces (use --legacy-peer-deps if npm errors)

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

npm run db:migrate                # apply SQL migrations to Supabase
npm run db:seed                   # destinations, packages, testimonials, admin user

npm run dev                       # API on :4000, web on :3000
```

Then open <http://localhost:3000>. API docs (Swagger UI) live at
<http://localhost:4000/api/v1/docs>.

> **Install note.** npm's arborist can fail on this dependency tree. If
> `npm install` crashes with an `edgesOut` error, rerun it with
> `--legacy-peer-deps`.

---

## Environment

`backend/.env` — copy from `backend/.env.example`.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Supabase **session pooler** URL (IPv4). `db.<ref>.supabase.co` is IPv6-only and will not resolve from most networks; use `aws-0-<region>.pooler.supabase.com` and the `postgres.<ref>` username form. |
| `BETTER_AUTH_SECRET` | yes | At least 16 characters. Generate one with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | no | Defaults to `API_URL`. |
| `API_URL` | no | Default `http://localhost:4000`. |
| `APP_URL` | no | Default `http://localhost:3000`. Added to CORS + trusted origins. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | Created and promoted to `admin` by `db:seed`. Defaults `admin@atlas.travel` / `ChangeMe!Admin123`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Google sign-in stays disabled until both are set. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | no | Admin uploads return `503` until configured. |
| `RESEND_API_KEY` / `EMAIL_FROM` | no | Without a key, emails are logged with a preview URL instead of being sent. |
| `LOG_LEVEL` | no | `fatal`…`trace`, or `silent`. |

`frontend/.env.local`:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | **Leave empty** in local dev. Next.js rewrites `/api/*` to the backend, so the browser sees first-party cookies and no CORS is involved. |
| `BACKEND_URL` | Default `http://localhost:4000`. |
| `NEXT_PUBLIC_SITE_URL` | Default `http://localhost:3000`. |

---

## Commands

Run from the repo root unless stated.

| Command | What it does |
| --- | --- |
| `npm run dev` | API + web in parallel |
| `npm run build` | Typecheck-compile backend to `dist/`, production build of frontend |
| `npm run start` | Run the built backend + frontend |
| `npm test` | Backend + frontend test suites |
| `npm run typecheck` | `tsc --noEmit` in both workspaces |
| `npm run db:generate` | Create a Drizzle migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Idempotent seed (re-running upserts by slug) |
| `npm run db:studio` | Drizzle Studio (database GUI) |

Backend-only equivalents: `npm run dev --workspace backend`, etc.

---

## Architecture

### Request flow

```
browser ──► Next.js (:3000)
              └── rewrite /api/* ──► Hapi API (:4000)
                                      ├── /api/v1/*   REST modules
                                      └── /api/auth/* Better Auth (Hapi proxies the
                                                        WHATWG Request/Response verbatim)
```

The frontend calls same-origin `/api/...`; Next rewrites those to `BACKEND_URL`.
CORS is still enabled (with credentials) for direct cross-origin clients.

### API conventions

Every response is enveloped:

```jsonc
// success
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 12, "total": 36 } }

// failure
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "No destination found for \"x\"." },
  "meta": { "path": "/api/v1/destinations/x", "method": "GET", "requestId": "…" }
}
```

`error.code` is one of `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`,
`NOT_FOUND`, `CONFLICT`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`,
`RATE_LIMITED`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`.

Errors thrown inside handlers are **Boom** values (`src/utils/errors.ts`).
Hapi's `Boom.boomify()` coerces any plain `Error` to a 500, so the factories
return Boom directly — never throw a bare `ApiError`.

### Database

Drizzle schema in `backend/src/db/schema/` (13 tables): Better Auth's
`user`/`session`/`account`/`verification`, plus `profiles`, `destinations`,
`destination_images`, `travel_packages`, `package_images`, `favorites`,
`travel_enquiries`, `newsletter_subscriptions`, `testimonials`.

Migrations are checked in under `backend/drizzle/`. Edit the schema, then run
`npm run db:generate` and `npm run db:migrate`.

### Auth

[Better Auth](https://better-auth.com) owns everything under `/api/auth`:
email/password sign-up and sign-in, password reset, email verification, and
Google OAuth (enabled only when credentials are present). The Hapi route
`/api/auth/{path*}` rebuilds the incoming request as a `Request`, forwards it
to `auth.handler()`, and returns the upstream status, headers and body
including `set-cookie`.

Profiles are created by a `user.create.after` database hook; the welcome email
is sent once the address is verified.

**Email verification is enforced** (`backend/src/plugins/auth.ts`):

- Sign-up sends a verification link but does **not** open a session.
- Sign-in for an unverified address returns `403 EMAIL_NOT_VERIFIED`; the login
  UI shows an inline notice with a "resend verification email" button, and
  `sendOnSignIn` re-sends the link on every blocked attempt.
- Clicking the link verifies the account, signs the user in
  (`autoSignInAfterVerification`) and redirects to the link's `callbackURL`.
- Verification/reset links are rewritten from the API origin to `APP_URL`
  (`toAppUrl`), so clicks land in the frontend rather than on raw `:4000`.

### Image uploads

`@hapi/multipart` is not published to npm, so uploads are **base64 data URLs**
(`data:image/jpeg;base64,…`) rather than multipart. `POST /api/v1/admin/uploads`
stores to Cloudinary; `POST /api/v1/admin/uploads/signature` returns parameters
for direct browser uploads. Both require an admin session, and
`GET /api/v1/health/ready` reports `uploads: configured` once Cloudinary
credentials are present.

### Rate limiting

An in-memory sliding-window limiter (`src/services/rate-limit.ts`) guards auth,
password reset, public submissions and uploads. It is per-process — swap it for
Redis before running more than one node.

---

## Seed data

`npm run db:seed` upserts by slug, so it is safe to re-run:

- 18 destinations with galleries, highlights, tags and best months
- 17 packages with itineraries, inclusions and exclusions
- 6 testimonials
- the admin account (email verified, role `admin`)

All photography uses live Unsplash URLs under the Unsplash License.

---

## Testing

Backend tests (`backend/tests/`) run with Vitest against the real database via
`server.inject()` — **51 tests / 6 files**:

- `unit/` — pagination, rate limiter
- `integration/health.test.ts` — health, ready, 404 envelope, CORS preflight, docs
- `integration/content.test.ts` — home, destinations, packages, filtering
- `integration/auth.test.ts` — sign-up, verification, sign-in, session, `/api/v1/me`, guards
- `integration/submissions.test.ts` — newsletter (incl. unsubscribe) and enquiry validation

Frontend tests (`frontend/tests/`, jsdom + Testing Library) — **20 tests /
3 files**: `utils.test.ts`, `button.test.tsx`, `api.test.ts`.

The auth suites create throwaway users and delete them afterwards. Run both
suites together with `npm test` from the repo root (the suites are also
independently runnable with `npx vitest run` per workspace).

---

## API surface

| Area | Endpoints |
| --- | --- |
| Health | `GET /api/v1/health`, `GET /api/v1/health/ready` |
| Docs | `GET /api/v1/docs`, `GET /api/v1/openapi.json` |
| Home | `GET /api/v1/home` |
| Destinations | `GET /api/v1/destinations`, `/filters`, `/{slug}`, `/{slug}/related` |
| Packages | `GET /api/v1/packages`, `/facets`, `/{slug}` |
| Account | `GET/PATCH /api/v1/me`, `POST /api/v1/me/resend-verification` |
| Favorites | `GET/POST /api/v1/favorites`, `DELETE /{entityType}/{entityId}`, `GET /check` |
| Enquiries | `POST/GET /api/v1/enquiries`, `GET /{id}` |
| Newsletter | `POST /api/v1/newsletter/subscribe`, `/unsubscribe` |
| Admin | `GET /api/v1/admin/uploads/policy`, `POST /signature`, `POST /api/v1/admin/uploads` |
| Auth | `/api/auth/*` (Better Auth) |

Full request/response schemas: <http://localhost:4000/api/v1/openapi.json>.

---

## Frontend pages

Routes live in two Next.js **route groups** so the auth flow can render without
site chrome:

- `app/(site)/` — wrapped in the shared shell (header + footer): every
  public/account page below.
- `app/(auth)/` — bare layout: the five auth pages. Each uses
  `components/auth-layout.tsx`, a split-screen shell (full-bleed travel image
  with a glossy sheen on the left, form on the right; stacks to a banner on
  mobile). No header/footer, so the form owns the full viewport.

| Route | Render | What it does |
| --- | --- | --- |
| `/` | SSR + revalidate | Hero, category chips, featured destinations, trending packages, testimonials, newsletter |
| `/destinations` | SSR + revalidate | Grid with category/continent filters and `?page=` pagination |
| `/destinations/[slug]` | SSR + revalidate | Hero, highlights, gallery, facts sidebar, packages in that destination |
| `/packages` | SSR + revalidate | Grid with style/price/length filters, sort, pagination |
| `/packages/[slug]` | SSR + revalidate | Itinerary, inclusions/exclusions, gallery, sticky enquiry card + sticky mobile CTA |
| `/login`, `/signup` | client | Better Auth email/password; honours `?next=`, inline unverified-email resend |
| `/forgot-password`, `/reset-password`, `/verify-email` | client | Reset + verification flows (with "link sent" states) |
| `/account` | client | Profile, saved trips, enquiry history, **sign out** (redirects to login) |
| `/saved` | client | Shortlist; prompts sign-in for guests |
| `/about`, `404` | static | Static content / not-found |

Conventions: the browser always calls same-origin `/api/*` (rewritten to the
Hapi server, so cookies are first-party); server components hit `BACKEND_URL`
directly. Data fetching is TanStack Query on the client, plain `fetch` with
revalidate tags on the server. All image slots use `next/image`. The layout is
responsive down to 320px (no `xl:` breakpoint layer — `lg` is the top tier),
and motion/shimmer effects respect `prefers-reduced-motion`. `npm run lint`
(frontend) and `npm run typecheck` (root) both pass.

---

## Production notes

- Point `DATABASE_URL` at the Supabase **direct** connection (not the pooler) or
  a pooled URL appropriate to your host, and run `npm run db:migrate` on deploy.
- Set `APP_URL`/`API_URL` to your real origins; they drive CORS and Better Auth
  trusted origins.
- `npm run build && npm start` runs the compiled backend from `dist/`.
- The backend serves no static assets — deploy the frontend separately and
  point `NEXT_PUBLIC_API_URL` at it (or keep the rewrite).
- Add the Cloudinary and Resend credentials before enabling uploads and email
  in production.

## Known gaps (Phase 1 scope)

- No admin UI: content and uploads are managed through the API.
- Google sign-in stays disabled with an explanatory hint until
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are supplied.
- Cloudinary and Resend degrade gracefully when unconfigured: uploads return
  `503` and emails are logged with a preview URL instead of being sent.
- Rate-limit state is in-memory (single node only).
