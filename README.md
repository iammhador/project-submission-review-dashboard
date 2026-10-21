# Project Submission & Review Dashboard

A full-stack dashboard where students submit projects and mentors review them.

> **Status:** project scaffold only. Authentication, the submission portal, and the
> review dashboard are being implemented in the following commits.

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
| `pnpm db:studio`   | Open Prisma Studio                           |

## Roadmap

- [ ] Database schema, migrations, and seeded mentor account
- [ ] JWT authentication (signup, login, guards)
- [ ] Student submission portal with validation, duplicate checks, and rate limiting
- [ ] Mentor dashboard with server-side pagination, filters, actions, and statistics
- [ ] Tests and deployment notes
