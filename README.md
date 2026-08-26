# nestjs-crud

Simple Nestjs CRUD application.

## stack

- NestJS 11, PostgreSQL + Drizzle ORM, Redis
- JWT access token, refresh token in httpOnly cookie
- docker-compose with postgres & redis services

## setup

```bash
pnpm install
docker compose up -d
cp .env.example .env
pnpm db:migrate
pnpm start:dev
```

Swagger: http://localhost:3000/docs

## scripts

```bash
pnpm test          # unit-tests
pnpm test:e2e      # e2e
pnpm lint && pnpm format
```

## structure

```
src/
  auth/           # jwt, controller, guards, strategies
  features/users/ # users module
  providers/      # drizzle (postgres), redis-кеш
  common/         # errors, filters, types, utils
  config/         # env validation
drizzle/          # sql migrations
```
