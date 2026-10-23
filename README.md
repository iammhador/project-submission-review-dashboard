# Project Submission & Review Dashboard

A full-stack dashboard where students submit projects and mentors review them.

> **Status:** database schema and JWT authentication are implemented. The student
> submission portal and mentor review dashboard are being implemented in the
> following commits.

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

## Scripts

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `pnpm dev`         | Run web and api in watch mode                |
| `pnpm dev:web`     | Run only the Next.js app                     |
| `pnpm dev:api`     | Run only the Express API                     |
| `pnpm build`       | Build all workspace packages                 |
| `pnpm typecheck`   | Type-check all workspace packages            |
| `pnpm lint`        | Lint all workspace packages                  |
| `pnpm db:up`       | Start PostgreSQL with Docker Compose         |
| `pnpm db:down`     | Stop PostgreSQL                              |
| `pnpm db:generate` | Generate the Prisma client                   |
| `pnpm db:migrate`  | Create/apply a development migration         |
| `pnpm db:seed`     | Seed the mentor account                      |
| `pnpm db:studio`   | Open Prisma Studio                           |

## Roadmap

- [x] Database schema, migrations, and seeded mentor account
- [x] JWT authentication (signup, login, guards)
- [ ] Student submission portal with validation, duplicate checks, and rate limiting
- [ ] Mentor dashboard with server-side pagination, filters, actions, and statistics
- [ ] Tests and deployment notes
