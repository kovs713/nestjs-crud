# nestjs-crud

NestJS 11 CRUD API: JWT auth (access + httpOnly refresh cookie), users with S3/MinIO avatars, balance transfers, BullMQ queue + cron.

## stack

- NestJS 11, PostgreSQL + Drizzle ORM, Redis (cache + BullMQ queue), S3/MinIO
- Auth: passport-jwt, argon2, access token + refresh cookie, roles guard
- Misc: idempotency interceptor, class-validator, Swagger

## setup

```bash
pnpm install
cp .env.example .env   # fill secrets
docker compose up -d   # postgres, redis, minio
pnpm db:migrate        # or pnpm db:push
pnpm db:seed           # admin user
pnpm start:dev
```

Swagger: http://localhost:3000/api/docs (prefix from `API_PREFIX`)

Create S3 bucket in MinIO console (`:9001`) matching `S3_BUCKET_NAME`.

## scripts

```bash
pnpm start:dev
pnpm build && pnpm start:prod
pnpm db:generate | pnpm db:migrate | pnpm db:push | pnpm db:seed
pnpm test              # unit
pnpm test:e2e          # e2e
pnpm test:integration  # testcontainers (pg)
pnpm test:cov
pnpm lint && pnpm format
```

## api (`/api`)

| module | routes |
|---|---|
| health | `GET /health` |
| auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| users | CRUD `GET|POST /users`, `GET|PATCH|DELETE /users/:id`, `GET /users/active`, avatars `GET|PATCH|DELETE /users/avatars…`, `GET /users/profile…` (write to others = admin) |
| balance | `POST /balance/transfer/:userId`, `POST /balance/reset` (queued, cron reset) |
