# Project Submission & Review Dashboard

A full-stack dashboard where students submit projects and mentors review them.

> **Status:** authentication, the student submission portal, the mentor review
> dashboard, and automated tests are implemented. Deployment notes are next.

## Stack

| Layer    | Technology                                   |
| -------- | -------------------------------------------- |
| Language | TypeScript                                    |
| Frontend | Next.js (App Router), Tailwind CSS, shadcn/ui |
| Backend  | Express.js                                    |
| Database | PostgreSQL + Prisma ORM                       |
| Auth     | JWT with role-based access control            |

## Repository layout

```
.
├── apps/
│   ├── api/              # Express + Prisma API
│   │   ├── prisma/       # schema and migrations
│   │   └── src/          # app, env, routes
│   └── web/              # Next.js frontend
│       └── src/app/      # App Router pages
├── packages/
│   └── shared/           # types/constants shared by web and api
├── docker-compose.yml    # local PostgreSQL
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- pnpm 12+
- Docker (for the local PostgreSQL instance)

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Create local environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Start PostgreSQL
pnpm db:up

# 4. Run both apps (web :3000, api :4000)
pnpm dev
```

Health check: <http://localhost:4000/health>

## Authentication

Passwords are hashed with bcrypt and sessions use a signed JWT (HS256, via
`jose`). The API accepts the token from the `awi_token` httpOnly cookie or an
`Authorization: Bearer <token>` header.

| Method | Endpoint           | Access | Description                          |
| ------ | ------------------ | ------ | ------------------------------------ |
| POST   | `/api/auth/signup` | Public | Create a student account             |
| POST   | `/api/auth/login`  | Public | Sign in and receive a session cookie |
| POST   | `/api/auth/logout` | Public | Clear the session cookie             |
| GET    | `/api/auth/me`     | Auth   | Return the current user              |

Signup always creates a `STUDENT`; mentor accounts are provisioned by the seed.
After starting the database and applying migrations, create the mentor account:

```bash
pnpm db:seed
```

The seed reads `SEED_MENTOR_NAME`, `SEED_MENTOR_EMAIL`, and
`SEED_MENTOR_PASSWORD` (see `apps/api/.env.example`) and defaults to
`mentor@awi.dev` / `mentor-password-123`. Change that password before deploying.

## Submissions and reviews

All endpoints require a session. Lists are paginated with `page` and
`pageSize` (default 10, max 50).

| Method | Endpoint                       | Access  | Description                                                  |
| ------ | ------------------------------ | ------- | ------------------------------------------------------------ |
| POST   | `/api/submissions`             | Student | Submit a project (one per repository URL)                    |
| GET    | `/api/submissions/mine`        | Student | The student's own submissions, newest first                  |
| GET    | `/api/submissions`             | Mentor  | All submissions; filter with `status` and search with `q`    |
| GET    | `/api/submissions/stats`       | Mentor  | Counts by status                                             |
| GET    | `/api/submissions/:id`         | Owner or mentor | One submission with its review                       |
| POST   | `/api/submissions/:id/review`  | Mentor  | Approve or reject a pending submission with an optional note |

The pending queue is ordered oldest first. A review moves the submission out of
`PENDING` and creates its `ProjectReview` in one transaction, so a submission
can only be reviewed once; rejecting requires a note.

## Web app

| Route                         | Who      | Description                                       |
| ----------------------------- | -------- | ------------------------------------------------- |
| `/`                           | Everyone | Landing page                                      |
| `/login`, `/signup`           | Visitors | Sign in, or create a student account              |
| `/dashboard`                  | Signed in | Students: their submissions. Mentors: review queue with stats, filters, and search |
| `/dashboard/submissions/new`  | Student  | Submission form                                   |
| `/dashboard/submissions/:id`  | Owner or mentor | Details, review result, and the mentor's review form |

The web app reads the API's `awi_token` cookie on the server to check the
session. That works locally because both apps run on `localhost`; in
production, serve the web app and API from the same parent domain.

## Tests

```bash
pnpm db:up   # the API tests need PostgreSQL running
pnpm test
```

- **API** (`apps/api/test`, Vitest + Supertest): integration tests against a
  real database covering auth, submissions, reviews, role checks, concurrent
  reviews, cascade rules, and the rate limiter. They use a separate database
  named after `DATABASE_URL` with a `_test` suffix (for example `awi_test`),
  which is migrated automatically and emptied before every test. Set
  `TEST_DATABASE_URL` to use another database; its name must end in `_test`.
- **Web** (`apps/web/src/**/*.test.ts`, Vitest): unit tests for the API client
  and formatting helpers.

## Scripts

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `pnpm dev`         | Run web and api in watch mode                |
| `pnpm dev:web`     | Run only the Next.js app                     |
| `pnpm dev:api`     | Run only the Express API                     |
| `pnpm build`       | Build all workspace packages                 |
| `pnpm typecheck`   | Type-check all workspace packages            |
| `pnpm lint`        | Lint all workspace packages                  |
| `pnpm test`        | Run the API and web test suites              |
| `pnpm db:up`       | Start PostgreSQL with Docker Compose         |
| `pnpm db:down`     | Stop PostgreSQL                              |
| `pnpm db:generate` | Generate the Prisma client                   |
| `pnpm db:migrate`  | Create/apply a development migration         |
| `pnpm db:seed`     | Seed the mentor account                      |
| `pnpm db:studio`   | Open Prisma Studio                           |

## Roadmap

- [x] Database schema, migrations, and seeded mentor account
- [x] JWT authentication (signup, login, guards)
- [x] Student submission portal with validation, duplicate checks, and rate limiting
- [x] Mentor dashboard with server-side pagination, filters, actions, and statistics
- [x] Automated tests
- [ ] Deployment notes
