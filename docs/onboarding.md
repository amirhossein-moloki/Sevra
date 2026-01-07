# Onboarding

## Requirements

- Node.js (TypeScript runtime)
- PostgreSQL (local or via Docker)
- Optional: Docker + Docker Compose for local DB

## Install

```bash
npm install
```

## Environment Variables

`src/config/env.ts` validates required configuration. The following variables are required unless noted:

- `NODE_ENV` (default: `development`)
- `APP_NAME` (default: `sevra`)
- `PORT` (default: `3000`)
- `LOG_LEVEL` (default: `info`)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN` (default: `15m`)
- `JWT_REFRESH_EXPIRES_IN` (default: `7d`)
- `DATABASE_URL`
- `CORS_ORIGIN` (default: `[]` or `*`)
- `CORS_CREDENTIALS` (default: `true`)
- `RATE_LIMIT_*` (rate limit settings)
- `PAYMENT_PROVIDER_WEBHOOK_SECRET`
- `MEDIA_STORAGE_DRIVER` (default: `local`)
- `MEDIA_PUBLIC_BASE_URL` (default: `http://localhost:3000`)
- `MEDIA_LOCAL_ROOT` (default: `storage`)
- `MEDIA_LOCAL_PUBLIC_PATH` (default: `/media`)
- `MEDIA_S3_*` (required if `MEDIA_STORAGE_DRIVER=s3`)

Additional required variable for OTP (validated in code, not in env schema):

- `SMSIR_OTP_TEMPLATE_ID`

## Database Setup

Using Docker Compose (provided in repo):

```bash
docker compose up -d db
```

Run Prisma migrations or generate client as needed:

```bash
npx prisma migrate dev
npx prisma generate
```

## Run (Dev)

```bash
npm run dev
```

## Build + Start

```bash
npm run build
npm run start
```

## Tests

- Full test suite (requires Docker and postgres):

```bash
npm test
```

- Unit tests only:

```bash
npm run test:unit
```

- E2E tests only:

```bash
npm run test:e2e
```

## Source of Truth

- `package.json`
- `docker-compose.yml`
- `src/config/env.ts`
- `src/server.ts`
