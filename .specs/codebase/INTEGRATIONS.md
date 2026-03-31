# External Integrations

## Databases

**Service:** PostgreSQL 15 (Docker) / 14 (CI)
**Purpose:** Primary relational storage — one logical database per module.
**Implementation:** TypeORM named DataSources (`'content'`, `'billing'`, `'identity'`, `'recommendations'`, `'analytics'`).
**Configuration:** Zod-validated env vars per module (e.g., `CONTENT_DATABASE_URL`, `RECOMMENDATIONS_DATABASE_URL`).
**Docker:** `postgres:15-alpine` with bind mount `.data/`.

## Message Queue

**Service:** Redis 7 (backing BullMQ)
**Purpose:** Async job processing for video pipelines, recommendation computation, analytics aggregation, content distribution.
**Implementation:** `@nestjs/bullmq` ^11.0.2; producers and consumers under `package/*/queue/`.
**Docker:** `redis:7-alpine` with named volume `redis-data`.

## In-Process Events

**Service:** @nestjs/event-emitter ^2.0.3
**Purpose:** Domain-style in-process event emission (content persistence module).
**Implementation:** `EventEmitterModule` registered in `ContentSharedModule`.

## API Integrations

### Billing API (HTTP — out-of-process)

**Purpose:** Check subscription status from identity module.
**Location:** `package/shared/module/public-api/http/client/billing-subscription-http.client.ts`
**Authentication:** Internal API (no external auth).
**Key endpoint:** `GET {billingApi.url}/subscription/user/:userId/active`

### External Movie Rating API (HTTP)

**Purpose:** Fetch external movie ratings (TMDB-style) during content creation.
**Location:** `package/content/management/http/client/external-movie-rating/`
**Authentication:** API key in config.
**Key endpoints:** Discover/search keyword endpoints.

### Google Gemini (GenAI SDK)

**Purpose:** Video transcription, summary generation, age recommendation extraction.
**Location:** `package/content/media/http/client/gemini-api/gemini-text-extractor.client.ts`
**Authentication:** `@google/genai` SDK with API key.

### Payment / Tax / Accounting (Simulated)

**Purpose:** Payment processing, tax calculation, accounting integration.
**Location:** `package/billing/http/client/` — `PaymentGatewayClient`, `EasyTaxClient`, `AccountingIntegrationClient`
**Status:** Simulated behavior (placeholder implementations for development).

## Background Jobs (BullMQ)

| Queue Area | Location | Jobs |
|---|---|---|
| Recommendations | `package/recommendations/queue/` | Recommendation computation |
| Analytics | `package/analytics/ingestion/queue/`, `aggregation/queue/` | Event ingestion, trending/genre aggregation |
| Content Media | `package/content/media/queue/` | Transcription, summary, age recommendation |
| Content Management | `package/content/management/queue/` | Content distribution, video processing |

## File Uploads

**Library:** multer (diskStorage)
**Location:** `ManagementMovieController`, `ManagementTvShowController`
**Purpose:** Asset uploads (video files, thumbnails) for content creation.

## Infrastructure / Deployment

**Docker Compose:** PostgreSQL + Redis only (development).
**CI:** `.github/workflows/main.yml` — Node 20.19.0, Postgres 14, Redis 7 services.
**Deploy:** `monolith-build-deploy.yaml`, `billing-api-build-deploy.yaml` (separate deployment pipelines).

## Unused Dependencies

**AWS SDK:** `@aws-sdk/client-dynamodb`, `aws-sdk` listed in `package.json` but no matching TypeScript imports found — likely reserved or unused.
