# External Integrations

## Database

**Service:** PostgreSQL 15
**Purpose:** Primary data store for all domain packages
**Implementation:** TypeORM 0.3.20 via `TypeOrmPersistenceModule.forRoot` with `addTransactionalDataSource`
**Configuration:** Per-domain datasource factories (`typeorm-datasource.factory.ts`), each with separate migration tables
**Datasources:** `analytics`, `billing`, `content`, `identity` — each has its own env vars (`*_DATABASE_HOST`, `*_DATABASE_PORT`, etc.)

## Queue System

**Service:** Redis 7 (via BullMQ)
**Purpose:** Async job processing for analytics and content pipelines
**Implementation:** `@nestjs/bullmq` with `BullModule.forRootAsync` + `registerQueue` in shared modules

### Analytics Queues

| Queue | Purpose | Location |
|-------|---------|----------|
| `analytics-event-processing` | Process ingested events into aggregations | `package/analytics/shared/queue/` |
| `analytics-genre-affinity-recomputation` | Recompute user genre affinities | `package/analytics/aggregation/queue/consumer/` |
| `analytics-trending-computation` | Compute trending content (repeatable: hourly daily / 6h weekly) | `package/analytics/aggregation/queue/consumer/` |

### Content Queues

| Queue | Purpose | Location |
|-------|---------|----------|
| `video-summary` | Generate AI video summary | `package/content/shared/queue/` |
| `video-transcript` | Transcribe video content | `package/content/media/queue/consumer/` |
| `video-age-recommendation` | AI-powered age rating per video | `package/content/media/queue/consumer/` |
| `content-age-recommendation` | Content-level age recommendation | `package/content/management/queue/consumer/` |

## API Integrations

### TMDb (The Movie Database)

**Purpose:** Keyword search + movie discovery for external ratings
**Location:** `package/content/management/http/client/external-movie-rating/external-movie-rating.client.ts`
**Authentication:** Bearer token from `content.movieDb.apiToken` (`CONTENT_MOVIEDB_*` env)
**Key endpoints:** Keyword search, movie discovery

### Google Gemini

**Purpose:** Video summary generation, transcription, age recommendation
**Location:** `package/content/media/http/client/gemini-api/gemini-text-extractor.client.ts`
**Authentication:** API key from `content.geminiApi.apiToken` (`CONTENT_GEMINI_API_TOKEN`)
**Model:** `gemini-2.0-flash`
**Note:** Reads video files as base64 inline data — memory concern for large files

### Billing HTTP API (Internal Cross-Service)

**Purpose:** Check user subscription status from identity module during sign-in
**Location:** `package/shared/module/public-api/http/client/billing-subscription-http.client.ts`
**Authentication:** Placeholder Bearer token (`PUT SOMETHING`)
**Endpoint:** `GET /subscription/user/:userId/active`

### Payment Gateway (Simulated)

**Purpose:** Process subscription payments
**Location:** `package/billing/http/client/payment-gateway-api/payment-gateway.client.ts`
**Note:** Not a real integration — random success/failure with simulated latency

## Authentication

**Module:** `package/shared/module/auth/auth.module.ts`
**Implementation:** JWT (HS256) via `@nestjs/jwt`, bcrypt for password hashing
**Guards:** `AuthGuard` (Bearer token verification, sets `userId` + `userRole` on CLS), `AdminGuard` (checks `userRole === 'admin'`)
**CLS:** `nestjs-cls` for request-scoped user context (middleware-mounted, global)
**GraphQL support:** `AuthGuard` handles both HTTP and GraphQL via `GqlExecutionContext`

## Event System

**Module:** `package/shared/module/event/event-emitter.module.ts`
**Service:** `EventEmitterService` wrapping `EventEmitter2`
**Status:** Infrastructure is in place but **not actively wired** — no `@OnEvent` handlers found in domain code. Billing services contain TODOs to emit events.

## Logging

**Factory:** `package/shared/module/logger/util/logger.factory.ts`
**Service:** `AppLogger` wrapping Winston `Logger`
**Behavior:** Console transport; dev = Nest-like format, non-dev = JSON; `silent` in test environment
**Usage:** Set as Nest app logger in `main.ts`
