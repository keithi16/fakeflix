# Analytics Design

**Spec**: `.specs/features/analytics/spec.md`
**Status**: Draft

---

## Architecture Overview

The analytics module follows **Light CQRS**: the write path (event ingestion) and read path (aggregated metrics) use separate tables, connected by BullMQ async processors. The module is organised into 4 subdomains matching the `@tlc/content` subdomain pattern.

```
                    ┌──────────────┐
                    │   Player     │
                    │   Client     │
                    └──────┬───────┘
                           │ POST /analytics/events
                           │ POST /analytics/heartbeat
                           ▼
                    ┌──────────────┐
                    │  Ingestion   │ ── persist ──▶ AnalyticsViewEvent (append-only)
                    │  Subdomain   │                AnalyticsHeartbeat (append-only)
                    └──────┬───────┘
                           │ enqueue
                           ▼
                    ┌──────────────┐
                    │   BullMQ     │
                    │   Queues     │
                    └──────┬───────┘
                           │ consume
                           ▼
                    ┌──────────────┐
                    │ Aggregation  │ ── upsert ──▶ Read Models:
                    │  Subdomain   │                • UserWatchHistory
                    └──────────────┘                • ContentPerformance
                                                    • TrendingContent
                           │                        • BingeSession
                           │                        • GenreAffinity
                           ▼
              ┌────────────┴────────────┐
              │                         │
       ┌──────────────┐         ┌──────────────┐
       │  Reporting    │         │  Public API   │
       │  (Admin)      │         │  (Facade)     │
       └──────────────┘         └──────┬────────┘
                                       │
                          ┌────────────┼────────────┐
                          ▼            ▼            ▼
                    ┌──────────┐ ┌──────────┐ ┌──────────────┐
                    │ Content  │ │ Identity │ │Recommendations│
                    │ Catalog  │ │ Profiles │ │  (future)     │
                    └──────────┘ └──────────┘ └──────────────┘
```

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
|---|---|---|
| `DefaultEntity` | `@tlc/shared-module/typeorm` | Extend for all analytics entities — provides `id`, `createdAt`, `updatedAt`, `deletedAt` |
| `DefaultTypeOrmRepository` | `@tlc/shared-module/typeorm` | Extend for all analytics repositories — provides `save`, `findOne`, `find`, `exists` |
| `TypeOrmPersistenceModule.forRoot()` | `@tlc/shared-module/typeorm` | Same pattern as billing/content for `dataSourceFactory` + `addTransactionalDataSource` |
| `AuthGuard` | `@tlc/shared-module/auth` | Protect all analytics endpoints (JWT verification, userId extraction into ClsService) |
| `ClsService` | `nestjs-cls` (via `@tlc/shared-module/auth`) | Extract `userId` from request context in controllers |
| `AppLogger` | `@tlc/shared-module/logger` | Structured logging with module identifier |
| `ConfigService` + Zod schemas | `@tlc/shared-module/config` | Same pattern as `package/billing/config.ts` — Zod schema + factory + `ConfigException` |
| BullMQ `@InjectQueue` + `Queue` | `@nestjs/bullmq` | Producer pattern from `package/content/admin/queue/producer/` |
| BullMQ `@Processor` + `WorkerHost` | `@nestjs/bullmq` | Consumer pattern from `package/content/video-processor/queue/consumer/` |
| `BullModule.forRootAsync()` | `@nestjs/bullmq` | Queue registration pattern from `package/content/shared/content-shared.module.ts` |
| Facade + Symbol pattern | `@tlc/shared-module/public-api` | Same pattern as `BillingFacade` + `BillingSubscriptionStatusApi` interface + symbol |
| `dataSourceOptionsFactory` | `package/billing/persistence/typeorm-datasource.factory.ts` | Same pattern for analytics datasource config |
| `plainToInstance` | `class-transformer` | Response DTO transformation in controllers (used in billing controllers) |
| `class-validator` decorators | `class-validator` | DTO validation (`@IsString`, `@IsEnum`, `@IsOptional`, etc.) |

### Integration Points

| System | Integration Method |
|---|---|
| `@tlc/content` (genre data) | Public API — call content's facade/API to get content genre mapping for affinity scoring |
| `@tlc/content` (catalog) | Inbound consumer — catalog imports `AnalyticsApi` for trending content |
| `@tlc/identity` | Inbound consumer — identity imports `AnalyticsApi` for resume position |
| `@tlc/billing` | No direct integration |

### New Component Required

| Component | Reason |
|---|---|
| `AdminGuard` or `RoleGuard` | No role-based guard exists in the codebase. Analytics admin endpoints need one. Create in `@tlc/shared-module/auth` so all modules can reuse it. |

---

## Components

### Shared Subdomain

#### `AnalyticsConfig` (config schema)
- **Purpose**: Validate and provide analytics-specific environment variables
- **Location**: `package/analytics/config.ts`
- **Interfaces**: `AnalyticsConfig` type (database + redis + binge/trending thresholds)
- **Reuses**: `ConfigException`, `environmentSchema` from `@tlc/shared-module/config`, Zod pattern from `package/billing/config.ts`

#### `AnalyticsSharedPersistenceModule`
- **Purpose**: Register TypeORM data source and all entity repositories
- **Location**: `package/analytics/shared/persistence/analytics-persistence.module.ts`
- **Reuses**: `TypeOrmPersistenceModule.forRoot()` + `addTransactionalDataSource` pattern from billing

#### `AnalyticsSharedModule`
- **Purpose**: Register BullMQ connection and queues, export persistence module
- **Location**: `package/analytics/shared/analytics-shared.module.ts`
- **Reuses**: `BullModule.forRootAsync()` + `BullModule.registerQueue()` pattern from content shared module

### Ingestion Subdomain

#### `EventIngestionService`
- **Purpose**: Orchestrate event persistence and BullMQ job enqueueing
- **Location**: `package/analytics/ingestion/core/service/event-ingestion.service.ts`
- **Interfaces**:
  - `recordEvent(userId, dto): Promise<void>` — persist event + enqueue aggregation
  - `recordHeartbeats(userId, dto): Promise<{ count: number }>` — bulk insert + detect implicit completion
- **Dependencies**: `ViewEventRepository`, `HeartbeatRepository`, `EventProcessingProducer`

#### `EventProcessingProducer`
- **Purpose**: Enqueue aggregation jobs to BullMQ
- **Location**: `package/analytics/ingestion/queue/producer/event-processing.queue-producer.ts`
- **Interfaces**:
  - `enqueueEventProcessing(payload: AnalyticsEventProcessingJobData): Promise<string>` — returns job ID
- **Reuses**: `@InjectQueue` + `Queue.add()` pattern from content producers

#### `PlayerEventController`
- **Purpose**: REST endpoints for event and heartbeat ingestion
- **Location**: `package/analytics/ingestion/http/rest/controller/player-event.controller.ts`
- **Interfaces**:
  - `POST /analytics/events` → `202 Accepted`
  - `POST /analytics/heartbeat` → `202 Accepted`
- **Dependencies**: `EventIngestionService`, `ClsService`, `AuthGuard`
- **Reuses**: Lean controller pattern (< 20 lines per method)

### Aggregation Subdomain

#### `EventAggregationConsumer`
- **Purpose**: BullMQ consumer that dispatches to aggregation services based on event type
- **Location**: `package/analytics/aggregation/queue/consumer/event-aggregation.queue-consumer.ts`
- **Dependencies**: `WatchHistoryAggregationService`, `ContentPerformanceAggregationService`, `BingeDetectionService`
- **Reuses**: `@Processor` + `WorkerHost` pattern from content consumers

#### `WatchHistoryAggregationService`
- **Purpose**: Upsert `AnalyticsUserWatchHistory` read model from raw events
- **Location**: `package/analytics/aggregation/core/service/watch-history-aggregation.service.ts`
- **Interfaces**:
  - `processEvent(event: AnalyticsEventProcessingJobData): Promise<void>`
- **Dependencies**: `UserWatchHistoryRepository`

#### `ContentPerformanceAggregationService`
- **Purpose**: Upsert `AnalyticsContentPerformance` read model
- **Location**: `package/analytics/aggregation/core/service/content-performance-aggregation.service.ts`
- **Interfaces**:
  - `processEvent(event: AnalyticsEventProcessingJobData): Promise<void>`
- **Dependencies**: `ContentPerformanceRepository`

#### `BingeDetectionService`
- **Purpose**: Detect and manage binge sessions on COMPLETE events for TV episodes
- **Location**: `package/analytics/aggregation/core/service/binge-detection.service.ts`
- **Interfaces**:
  - `evaluateBinge(userId, seriesContentId, occurredAt): Promise<void>`
- **Dependencies**: `BingeSessionRepository`, `UserWatchHistoryRepository`, `ConfigService`

#### `GenreAffinityService`
- **Purpose**: Scheduled recomputation of per-user genre affinity scores
- **Location**: `package/analytics/aggregation/core/service/genre-affinity.service.ts`
- **Interfaces**:
  - `recomputeAll(): Promise<void>` — triggered by scheduled BullMQ job
- **Dependencies**: `GenreAffinityRepository`, `UserWatchHistoryRepository`, content genre data (via cross-module API)

#### `TrendingComputationService`
- **Purpose**: Scheduled computation of time-windowed trending rankings
- **Location**: `package/analytics/aggregation/core/service/trending-computation.service.ts`
- **Interfaces**:
  - `computeWindow(windowType: 'DAILY' | 'WEEKLY'): Promise<void>`
- **Dependencies**: `TrendingContentRepository`, `ViewEventRepository`, `ContentPerformanceRepository`

#### `GenreAffinityRecomputationConsumer`
- **Purpose**: Scheduled BullMQ consumer that triggers genre affinity recomputation
- **Location**: `package/analytics/aggregation/queue/consumer/genre-affinity-recomputation.queue-consumer.ts`
- **Reuses**: `@Processor` + `WorkerHost` pattern

#### `TrendingComputationConsumer`
- **Purpose**: Scheduled BullMQ consumer that triggers trending recomputation
- **Location**: `package/analytics/aggregation/queue/consumer/trending-computation.queue-consumer.ts`
- **Reuses**: `@Processor` + `WorkerHost` pattern

### Reporting Subdomain

#### `ReportingService`
- **Purpose**: Orchestrate report queries with pagination, sorting, filtering, and time-range support
- **Location**: `package/analytics/reporting/core/service/reporting.service.ts`
- **Interfaces**:
  - `getContentPerformance(query): Promise<PaginatedResult<ContentPerformanceDto>>`
  - `getContentPerformanceDetail(contentId, query): Promise<ContentPerformanceDetailDto>`
  - `getTopContent(query): Promise<ContentPerformanceDto[]>`
  - `getBottomContent(query): Promise<ContentPerformanceDto[]>`
  - `getUserEngagement(query): Promise<UserEngagementSummaryDto>`
  - `getUserEngagementDetail(userId): Promise<UserEngagementDetailDto>`
  - `getTrending(query): Promise<TrendingResponseDto>`
- **Dependencies**: All read model repositories

#### `CsvExportService`
- **Purpose**: Stream entity data to CSV format without loading entire dataset into memory
- **Location**: `package/analytics/reporting/core/service/csv-export.service.ts`
- **Interfaces**:
  - `exportContentPerformance(query, response): Promise<void>` — streams CSV to HTTP response
  - `exportUserEngagement(query, response): Promise<void>`
- **Dependencies**: Read model repositories, `Response` object (for streaming)

#### `AdminAnalyticsController`
- **Purpose**: REST endpoints for admin analytics dashboard
- **Location**: `package/analytics/reporting/http/rest/controller/admin-analytics.controller.ts`
- **Interfaces**:
  - `GET /analytics/admin/content-performance` — paginated list
  - `GET /analytics/admin/content-performance/top` — top performing
  - `GET /analytics/admin/content-performance/bottom` — bottom performing
  - `GET /analytics/admin/content-performance/:contentId` — detail
  - `GET /analytics/admin/user-engagement` — summary with time series
  - `GET /analytics/admin/user-engagement/:userId` — per-user detail
  - `GET /analytics/admin/trending` — trending list
  - `GET /analytics/admin/export/content-performance` — CSV export
  - `GET /analytics/admin/export/user-engagement` — CSV export
- **Dependencies**: `ReportingService`, `CsvExportService`, `AuthGuard`, `AdminGuard`
- **Reuses**: Lean controller pattern

### Public API

#### `AnalyticsApi` (interface + symbol)
- **Purpose**: Cross-module contract for analytics data
- **Location**: `package/shared/module/public-api/interface/analytics-public-api.interface.ts`
- **Interfaces**:
  - `getUserWatchHistory(userId, options?): Promise<UserWatchHistoryItem[]>`
  - `getUserResumePosition(userId, contentId): Promise<ResumePosition | null>`
  - `getTrendingContent(windowType, limit?): Promise<TrendingContentItem[]>`
  - `getContentPerformanceMetrics(contentId): Promise<ContentPerformanceMetrics | null>`
  - `getUserGenreAffinities(userId): Promise<GenreAffinityItem[]>`
- **Reuses**: Same interface + symbol pattern as `BillingSubscriptionStatusApi`

#### `AnalyticsFacade`
- **Purpose**: In-process implementation of `AnalyticsApi`
- **Location**: `package/analytics/public-api/facade/analytics.facade.ts`
- **Dependencies**: All read model repositories
- **Reuses**: Same facade pattern as `BillingFacade`

---

## Data Models

### Write Models (Append-Only)

```typescript
// AnalyticsViewEvent — @Entity({ name: 'AnalyticsViewEvent' })
interface AnalyticsViewEvent {
  id: string;              // uuid PK
  userId: string;
  contentId: string;
  contentType: AnalyticsContentType;
  eventType: AnalyticsEventType;
  sessionId: string;
  positionMs: number;
  durationMs: number;
  metadata: Record<string, unknown>;  // jsonb
  occurredAt: Date;
  receivedAt: Date;
  // inherits createdAt, updatedAt from DefaultEntity
}

// AnalyticsHeartbeat — @Entity({ name: 'AnalyticsHeartbeat' })
interface AnalyticsHeartbeat {
  id: string;
  userId: string;
  contentId: string;
  sessionId: string;
  positionMs: number;
  durationMs: number;
  occurredAt: Date;
  receivedAt: Date;
}
```

### Read Models (Upserted by Aggregation)

```typescript
// AnalyticsUserWatchHistory — @Entity({ name: 'AnalyticsUserWatchHistory' })
// Unique: (userId, contentId)
interface AnalyticsUserWatchHistory {
  id: string;
  userId: string;
  contentId: string;
  contentType: AnalyticsContentType;
  lastWatchedPositionMs: number;
  totalWatchTimeMs: number;
  completionPercentage: number;   // decimal(5,2), 0.00–100.00
  completed: boolean;
  watchCount: number;
  firstWatchedAt: Date;
  lastWatchedAt: Date;
  updatedAt: Date;
}

// AnalyticsContentPerformance — @Entity({ name: 'AnalyticsContentPerformance' })
// Unique: (contentId)
interface AnalyticsContentPerformance {
  id: string;
  contentId: string;
  contentType: AnalyticsContentType;
  totalViews: number;
  uniqueViewers: number;
  totalWatchTimeMs: number;        // bigint
  avgCompletionPercentage: number; // decimal(5,2)
  completionCount: number;
  lastComputedAt: Date;
}

// AnalyticsTrendingContent — @Entity({ name: 'AnalyticsTrendingContent' })
// Unique: (contentId, windowType, windowStart)
interface AnalyticsTrendingContent {
  id: string;
  contentId: string;
  contentType: AnalyticsContentType;
  windowType: AnalyticsTrendingWindowType;
  windowStart: Date;
  windowEnd: Date;
  viewCount: number;
  uniqueViewers: number;
  trendingScore: number;           // decimal(10,2)
  rank: number;
  computedAt: Date;
}

// AnalyticsBingeSession — @Entity({ name: 'AnalyticsBingeSession' })
interface AnalyticsBingeSession {
  id: string;
  userId: string;
  seriesContentId: string;
  episodeCount: number;
  totalWatchTimeMs: number;
  startedAt: Date;
  endedAt: Date | null;
  updatedAt: Date;
}

// AnalyticsGenreAffinity — @Entity({ name: 'AnalyticsGenreAffinity' })
// Unique: (userId, genre)
interface AnalyticsGenreAffinity {
  id: string;
  userId: string;
  genre: string;
  affinityScore: number;          // decimal(5,2), 0.00–100.00
  totalWatchTimeMs: number;
  contentCount: number;
  lastUpdatedAt: Date;
}
```

**Relationships**: All cross-module references (userId, contentId, seriesContentId) are string references — no foreign keys across module boundaries.

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
|---|---|---|
| Invalid event DTO (missing fields) | `ValidationPipe` throws `400 Bad Request` | Client gets validation error details |
| Unauthenticated request | `AuthGuard` throws `401 Unauthorized` | Client must provide valid JWT |
| Non-admin accessing admin endpoints | `AdminGuard` throws `403 Forbidden` | Only admins can access dashboard |
| BullMQ aggregation job fails | Retry 3x with exponential backoff; dead-letter after exhaustion | No immediate user impact; read models may lag |
| Division by zero (durationMs = 0) | Guard in aggregation: set completionPercentage to 0 | No error; graceful default |
| Content not found in performance | Return `null` from facade, `404` from admin endpoint | Client handles empty state |
| Database connection failure | TypeORM connection pool handles reconnection | Ingestion returns 5xx; events are lost (acceptable trade-off for append-only) |
| Scheduled job overlap | BullMQ concurrency: 1 ensures single-instance execution | No overlap; jobs queue sequentially |

---

## Tech Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Subdomain-based structure | 4 subdomains: shared, ingestion, aggregation, reporting | Clear separation of write (ingestion), process (aggregation), and read (reporting) concerns — matches content module pattern |
| Append-only without replay | INSERT-only tables, no event replay | Keeps complexity manageable while teaching the core event store pattern; replay can be added later |
| Light CQRS over full CQRS | Separate tables, BullMQ-connected | Pre-computed read models are simpler than materialized views and sufficient for dashboard queries |
| Scheduled jobs via BullMQ repeatable | Not cron, not setTimeout | BullMQ repeatable jobs are durable, survive restarts, and prevent overlap — same infra as event processing |
| AdminGuard as new shared component | New guard in `@tlc/shared-module/auth` | No role-based guard exists; creating it as shared makes it reusable across billing/content admin features too |
| CSV streaming | `Transform` stream piped to HTTP response | Avoids loading large datasets into memory; follows Node.js streaming best practices |
| Genre data fetched from content | HTTP client or in-process facade call | Follows cross-module communication pattern; genre data is cached since it changes infrequently |
