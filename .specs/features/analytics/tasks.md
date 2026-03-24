# Analytics Tasks

**Design**: `.specs/features/analytics/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation (Sequential)

Module scaffolding, config, shared entities, persistence. Everything else depends on this.

```
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: Ingestion — Write Path (Sequential, after Phase 1)

DTOs, services, producer, controller, module wiring.

```
T7 → T8 → T9 → T10 → T11
```

### Phase 3: Core Aggregation (Parallel after Phase 1, Sequential internally)

Watch history + content performance aggregation services and BullMQ consumer.

```
     ┌→ T12 ─┐
T6 ──┤       ├──→ T14 → T15
     └→ T13 ─┘
```

### Phase 4: Public API Facade — MVP (Sequential, after Phase 3)

Interface, facade implementation, module wiring.

```
T15 → T16 → T17 → T18
```

### Phase 5: Reporting — Admin Dashboard (Parallel with Phase 4, after Phase 3)

Admin DTOs, reporting service, CSV export, controller, module.

```
         ┌→ T19 ─┐
T15 ──── ┤       ├──→ T21 → T22 → T23 → T24
         └→ T20 ─┘
```

### Phase 6: Root Module + App Integration (After Phases 4 & 5)

```
T18, T24 → T25 → T26
```

### Phase 7: Trending (After Phase 6)

Trending entity, repository, computation service, scheduled consumer, admin + facade extension.

```
T26 → T27 → T28 → T29 → T30 → T31
```

### Phase 8: Advanced Analytics (Parallel, after Phase 6)

Binge detection and genre affinity — independent of each other.

```
      ┌→ T32 → T33 → T34 ─┐
T26 ──┤                    ├──→ T38
      └→ T35 → T36 → T37 ─┘
```

### Phase 9: E2E Tests (After Phase 8)

```
T38 → T39 → T40 → T41 → T42 → T43
```

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 → T2 → T3 → T4 → T5 → T6

Phase 2 (Sequential):
  T6 → T7 → T8 → T9 → T10 → T11

Phase 3 (Parallel):
  T6 complete, then:
    ├── T12 [P] (watch history service)
    └── T13 [P] (content perf service)
  Both complete → T14 → T15

Phase 4 & 5 (Parallel):
  T15 complete, then:
    ├── T16 → T17 → T18 (facade)     [P]
    └── T19, T20 → T21 → ... → T24  [P]

Phase 6 (Sequential):
  T18, T24 → T25 → T26

Phase 7 (Sequential):
  T26 → T27 → T28 → T29 → T30 → T31

Phase 8 (Parallel):
  T26 complete, then:
    ├── T32 → T33 → T34 (binge)         [P]
    └── T35 → T36 → T37 (genre affinity) [P]
  Both complete → T38

Phase 9 (Sequential):
  T38 → T39 → T40 → T41 → T42 → T43
```

---

## Task Breakdown

### Phase 1: Foundation

#### T1: Create NX project configuration

**What**: Create `project.json` and `jest.config.ts` for the analytics package
**Where**: `package/analytics/project.json`, `package/analytics/jest.config.ts`
**Depends on**: None
**Reuses**: `package/billing/project.json` (same target structure: `lint:check`, `lint:fix`, `test:e2e`, `db:generate`, `db:migrate`, `db:drop`)
**Requirement**: Foundation (all ANLYT-*)

**Tools**:
- MCP: `context7` (NestJS/NX config if needed)
- Skill: NONE

**Done when**:
- [ ] `project.json` defines `lint:check`, `lint:fix`, `test:e2e`, `db:generate`, `db:migrate`, `db:drop` targets
- [ ] `jest.config.ts` follows billing/content pattern
- [ ] `tsconfig.json` / `tsconfig.lib.json` exists if required by NX

**Verify**: `nx show project analytics` shows all targets

**Commit**: `feat(analytics): scaffold NX project configuration`

---

#### T2: Create analytics config schema

**What**: Create Zod-validated config schema with database, Redis, and analytics-specific settings
**Where**: `package/analytics/config.ts`
**Depends on**: T1
**Reuses**: `package/billing/config.ts` (Zod schema + factory + `ConfigException` pattern)
**Requirement**: Foundation (all ANLYT-*)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Zod schema validates `analytics.database.*`, `analytics.redis.*`, and threshold configs
- [ ] `factory()` function reads env vars and throws `ConfigException` on invalid config
- [ ] `AnalyticsConfig` type is exported

**Verify**: Import config and call `factory()` — should throw if env vars are missing

**Commit**: `feat(analytics): add Zod-validated config schema`

---

#### T3: Create shared enums and queue constants

**What**: Define `AnalyticsEventType`, `AnalyticsContentType`, `AnalyticsTrendingWindowType` enums and `ANALYTICS_QUEUES` constant
**Where**: `package/analytics/shared/enum/analytics-event-type.enum.ts`, `package/analytics/shared/enum/analytics-content-type.enum.ts`, `package/analytics/shared/enum/analytics-trending-window-type.enum.ts`, `package/analytics/shared/queue/queue-constants.ts`
**Depends on**: T1
**Reuses**: `package/content/shared/queue/queue-constants.ts` (constant pattern)
**Requirement**: Foundation

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] 3 enums defined: `AnalyticsEventType` (PLAY, PAUSE, RESUME, STOP, COMPLETE), `AnalyticsContentType` (MOVIE, TV_EPISODE), `AnalyticsTrendingWindowType` (DAILY, WEEKLY)
- [ ] `ANALYTICS_QUEUES` object with `EVENT_PROCESSING`, `GENRE_AFFINITY_RECOMPUTATION`, `TRENDING_COMPUTATION`
- [ ] All exported from their files

**Verify**: TypeScript compiles with no errors

**Commit**: `feat(analytics): add shared enums and queue constants`

---

#### T4: Create write model entities

**What**: Create `AnalyticsViewEvent` and `AnalyticsHeartbeat` TypeORM entities
**Where**: `package/analytics/shared/persistence/entity/analytics-view-event.entity.ts`, `package/analytics/shared/persistence/entity/analytics-heartbeat.entity.ts`
**Depends on**: T3
**Reuses**: `DefaultEntity` from `@tlc/shared-module/typeorm`
**Requirement**: ANLYT-01, ANLYT-02

**Tools**:
- MCP: `context7` (TypeORM entity decorators)
- Skill: NONE

**Done when**:
- [ ] `AnalyticsViewEvent` entity with all columns from design: `userId`, `contentId`, `contentType`, `eventType`, `sessionId`, `positionMs`, `durationMs`, `metadata` (jsonb), `occurredAt`, `receivedAt`
- [ ] `AnalyticsHeartbeat` entity with all columns: `userId`, `contentId`, `sessionId`, `positionMs`, `durationMs`, `occurredAt`, `receivedAt`
- [ ] Both extend `DefaultEntity`
- [ ] `@Entity({ name: 'AnalyticsViewEvent' })` and `@Entity({ name: 'AnalyticsHeartbeat' })` — module-prefixed
- [ ] Indexes on: `(userId, occurredAt)`, `(contentId, occurredAt)`, `(sessionId)` for ViewEvent; `(sessionId, occurredAt)`, `(userId, contentId, occurredAt)` for Heartbeat

**Verify**: TypeScript compiles; entity decorators are correct

**Commit**: `feat(analytics): add write model entities (ViewEvent, Heartbeat)`

---

#### T5: Create read model entities

**What**: Create `AnalyticsUserWatchHistory`, `AnalyticsContentPerformance`, `AnalyticsTrendingContent`, `AnalyticsBingeSession`, `AnalyticsGenreAffinity` TypeORM entities
**Where**: `package/analytics/shared/persistence/entity/` (one file per entity)
**Depends on**: T3
**Reuses**: `DefaultEntity` from `@tlc/shared-module/typeorm`
**Requirement**: ANLYT-03, ANLYT-04, ANLYT-09, ANLYT-11, ANLYT-12

**Tools**:
- MCP: `context7` (TypeORM entity decorators, unique constraints)
- Skill: NONE

**Done when**:
- [ ] 5 entities created with all columns from design document
- [ ] Unique constraints: `(userId, contentId)` on WatchHistory, `(contentId)` on ContentPerformance, `(contentId, windowType, windowStart)` on TrendingContent, `(userId, genre)` on GenreAffinity
- [ ] All extend `DefaultEntity` with module-prefixed `@Entity` names
- [ ] `decimal` columns use `{ type: 'decimal', precision: 5, scale: 2 }` (or `10,2` for trendingScore)

**Verify**: TypeScript compiles; all unique constraints are defined

**Commit**: `feat(analytics): add read model entities (WatchHistory, ContentPerformance, Trending, Binge, GenreAffinity)`

---

#### T6: Create repositories, persistence module, and shared module

**What**: Create all 7 repositories, the persistence module, datasource factory, and the shared module with BullMQ registration
**Where**: `package/analytics/shared/persistence/repository/` (7 files), `package/analytics/shared/persistence/analytics-persistence.module.ts`, `package/analytics/shared/persistence/typeorm-datasource.factory.ts`, `package/analytics/shared/analytics-shared.module.ts`
**Depends on**: T4, T5
**Reuses**: `DefaultTypeOrmRepository` from `@tlc/shared-module/typeorm`, `BillingPersistenceModule` pattern, `ContentSharedModule` BullMQ pattern
**Requirement**: Foundation (all ANLYT-*)

**Tools**:
- MCP: `context7` (NestJS BullMQ module setup)
- Skill: NONE

**Done when**:
- [ ] 7 repositories extend `DefaultTypeOrmRepository`: `ViewEventRepository`, `HeartbeatRepository`, `UserWatchHistoryRepository`, `ContentPerformanceRepository`, `TrendingContentRepository`, `BingeSessionRepository`, `GenreAffinityRepository`
- [ ] Each repository uses `@InjectDataSource('analytics')` and `super(Entity, dataSource.manager)`
- [ ] Repositories have business-meaningful query methods as defined in design (e.g., `upsertByUserAndContent`, `findTopByMetric`, `bulkInsert`)
- [ ] `typeorm-datasource.factory.ts` creates postgres connection options with `name: 'analytics'`
- [ ] `AnalyticsSharedPersistenceModule` registers TypeORM with `dataSourceFactory` + `addTransactionalDataSource`
- [ ] `AnalyticsSharedModule` registers BullMQ `forRootAsync` (Redis) and `registerQueue` for all 3 queues
- [ ] Persistence module exports all repositories
- [ ] Shared module exports persistence module and BullMQ

**Verify**: Module compiles; `nx lint:check analytics` passes

**Commit**: `feat(analytics): add repositories, persistence module, and shared BullMQ module`

---

### Phase 2: Ingestion — Write Path

#### T7: Create ingestion DTOs

**What**: Create `RecordPlayerEventDto` and `RecordHeartbeatBatchDto` with class-validator decorators
**Where**: `package/analytics/ingestion/http/rest/dto/record-player-event.dto.ts`, `package/analytics/ingestion/http/rest/dto/record-heartbeat-batch.dto.ts`
**Depends on**: T3
**Reuses**: class-validator patterns from billing DTOs
**Requirement**: ANLYT-01, ANLYT-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `RecordPlayerEventDto`: validates `contentId` (string, required), `contentType` (enum), `eventType` (enum), `sessionId` (string, required), `positionMs` (number, required), `durationMs` (number, required), `metadata` (optional object), `occurredAt` (ISO string, required)
- [ ] `RecordHeartbeatBatchDto`: validates `heartbeats` (array, min 1) where each item has `contentId`, `sessionId`, `positionMs`, `durationMs`, `occurredAt`
- [ ] All decorators properly applied: `@IsString`, `@IsEnum`, `@IsNumber`, `@IsOptional`, `@IsArray`, `@ValidateNested`, `@Type`

**Verify**: Instantiate DTO with invalid data → validation errors thrown

**Commit**: `feat(analytics): add ingestion request DTOs with validation`

---

#### T8: Create EventProcessingProducer

**What**: BullMQ producer that enqueues aggregation jobs
**Where**: `package/analytics/ingestion/queue/producer/event-processing.queue-producer.ts`
**Depends on**: T6
**Reuses**: `ContentAgeRecommendationQueueProducer` pattern from content
**Requirement**: ANLYT-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Injects `@InjectQueue(ANALYTICS_QUEUES.EVENT_PROCESSING)` as `Queue`
- [ ] `enqueueEventProcessing(payload)` calls `queue.add('process', payload)` with job options (3 attempts, exponential backoff)
- [ ] Logs job ID on success
- [ ] Returns job ID

**Verify**: TypeScript compiles; producer is injectable

**Commit**: `feat(analytics): add event processing BullMQ producer`

---

#### T9: Create EventIngestionService

**What**: Service that orchestrates event persistence and job enqueueing
**Where**: `package/analytics/ingestion/core/service/event-ingestion.service.ts`
**Depends on**: T6, T8
**Reuses**: Service patterns from billing
**Requirement**: ANLYT-01, ANLYT-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `recordEvent(userId, dto)`: persists `AnalyticsViewEvent` via repository, enqueues aggregation job for PLAY/STOP/COMPLETE events (skips PAUSE/RESUME)
- [ ] `recordHeartbeats(userId, dto)`: bulk-inserts heartbeats via repository, detects implicit completion (positionMs/durationMs >= 0.90) and enqueues COMPLETE job if found
- [ ] Uses `@Transactional({ connectionName: 'analytics' })` on write methods
- [ ] Guards against `durationMs === 0` (avoids division by zero)
- [ ] Returns `{ count }` for heartbeats

**Verify**: Unit test: mock repositories and producer, verify correct calls

**Commit**: `feat(analytics): add event ingestion service`

---

#### T10: Create PlayerEventController

**What**: REST controller with POST endpoints for events and heartbeats
**Where**: `package/analytics/ingestion/http/rest/controller/player-event.controller.ts`
**Depends on**: T7, T9
**Reuses**: Lean controller pattern from billing (< 20 lines per method)
**Requirement**: ANLYT-01, ANLYT-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `POST /analytics/events`: extracts userId from `ClsService`, calls `eventIngestionService.recordEvent()`, returns `202 Accepted` with `{ received: true }`
- [ ] `POST /analytics/heartbeat`: extracts userId, calls `recordHeartbeats()`, returns `202 Accepted` with `{ received: true, count }`
- [ ] Both decorated with `@UseGuards(AuthGuard)`
- [ ] Uses `@HttpCode(HttpStatus.ACCEPTED)` for 202
- [ ] Each method ≤ 10 lines
- [ ] Uses `@UsePipes(ValidationPipe)` or global pipe

**Verify**: Controller compiles; decorators are correct

**Commit**: `feat(analytics): add player event REST controller`

---

#### T11: Create AnalyticsIngestionModule

**What**: NestJS module wiring for the ingestion subdomain
**Where**: `package/analytics/ingestion/analytics-ingestion.module.ts`
**Depends on**: T8, T9, T10
**Requirement**: ANLYT-01, ANLYT-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Imports `AnalyticsSharedModule`
- [ ] Provides `EventIngestionService`, `EventProcessingProducer`
- [ ] Declares `PlayerEventController`
- [ ] Exports nothing (ingestion is not consumed by other subdomains)

**Verify**: Module compiles

**Commit**: `feat(analytics): wire ingestion module`

---

### Phase 3: Core Aggregation

#### T12: Create WatchHistoryAggregationService [P]

**What**: Service that upserts `AnalyticsUserWatchHistory` from processed events
**Where**: `package/analytics/aggregation/core/service/watch-history-aggregation.service.ts`
**Depends on**: T6
**Reuses**: Repository upsert patterns
**Requirement**: ANLYT-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `processEvent(event)`: handles PLAY (create/update entry, increment watchCount for new session), STOP (update position, recalculate completion%, accumulate watchTime), COMPLETE (set completed=true)
- [ ] Calculates `completionPercentage = (positionMs / durationMs) * 100`, guards durationMs=0
- [ ] Uses `@Transactional({ connectionName: 'analytics' })` for upserts
- [ ] Updates `lastWatchedAt` on every event
- [ ] Sets `firstWatchedAt` only on first creation

**Verify**: Unit test: feed PLAY→STOP→COMPLETE sequence, verify watch history state

**Commit**: `feat(analytics): add watch history aggregation service`

---

#### T13: Create ContentPerformanceAggregationService [P]

**What**: Service that upserts `AnalyticsContentPerformance` from processed events
**Where**: `package/analytics/aggregation/core/service/content-performance-aggregation.service.ts`
**Depends on**: T6
**Reuses**: Repository upsert patterns
**Requirement**: ANLYT-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `processEvent(event)`: handles PLAY (increment totalViews deduplicated by session, update uniqueViewers), COMPLETE (increment completionCount)
- [ ] Recalculates `avgCompletionPercentage` and accumulates `totalWatchTimeMs`
- [ ] Uses `@Transactional({ connectionName: 'analytics' })` for upserts
- [ ] Creates new `AnalyticsContentPerformance` if none exists for contentId

**Verify**: Unit test: feed events from 3 users, verify aggregated metrics

**Commit**: `feat(analytics): add content performance aggregation service`

---

#### T14: Create EventAggregationConsumer

**What**: BullMQ consumer that dispatches to aggregation services
**Where**: `package/analytics/aggregation/queue/consumer/event-aggregation.queue-consumer.ts`
**Depends on**: T12, T13
**Reuses**: `@Processor` + `WorkerHost` from content consumers
**Requirement**: ANLYT-03, ANLYT-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Decorated with `@Processor(ANALYTICS_QUEUES.EVENT_PROCESSING)`
- [ ] `process(job)`: calls `watchHistoryAggregationService.processEvent()` and `contentPerformanceAggregationService.processEvent()` for each job
- [ ] `@OnWorkerEvent('failed')`: logs error with job data context
- [ ] Handles errors per service independently (one failure doesn't prevent the other)

**Verify**: TypeScript compiles; consumer is registered

**Commit**: `feat(analytics): add event aggregation BullMQ consumer`

---

#### T15: Create AnalyticsAggregationModule

**What**: NestJS module wiring for the aggregation subdomain
**Where**: `package/analytics/aggregation/analytics-aggregation.module.ts`
**Depends on**: T12, T13, T14
**Requirement**: ANLYT-03, ANLYT-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Imports `AnalyticsSharedModule`
- [ ] Provides `WatchHistoryAggregationService`, `ContentPerformanceAggregationService`, `EventAggregationConsumer`
- [ ] Exports aggregation services (needed by reporting for query access)

**Verify**: Module compiles

**Commit**: `feat(analytics): wire aggregation module`

---

### Phase 4: Public API Facade — MVP

#### T16: Create AnalyticsApi interface and symbol

**What**: Define the cross-module contract interface in shared module
**Where**: `package/shared/module/public-api/interface/analytics-public-api.interface.ts`
**Depends on**: T15
**Reuses**: `BillingSubscriptionStatusApi` interface + symbol pattern
**Requirement**: ANLYT-05, ANLYT-13

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `AnalyticsApi` interface with 5 methods: `getUserWatchHistory`, `getUserResumePosition`, `getTrendingContent`, `getContentPerformanceMetrics`, `getUserGenreAffinities`
- [ ] Return types defined: `UserWatchHistoryItem`, `ResumePosition`, `TrendingContentItem`, `ContentPerformanceMetrics`, `GenreAffinityItem`
- [ ] `export const AnalyticsApi = Symbol('AnalyticsApi')` for DI token
- [ ] Exported from `package/shared/module/public-api/index.ts`

**Verify**: Import and reference the interface — TypeScript compiles

**Commit**: `feat(shared): add AnalyticsApi interface and DI token`

---

#### T17: Create AnalyticsFacade

**What**: In-process implementation of `AnalyticsApi` using read model repositories
**Where**: `package/analytics/public-api/facade/analytics.facade.ts`
**Depends on**: T16
**Reuses**: `BillingFacade` pattern
**Requirement**: ANLYT-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Implements `AnalyticsApi` interface
- [ ] `getUserWatchHistory(userId, options?)`: queries `UserWatchHistoryRepository`, supports `limit` and `completedOnly` options, returns sorted by `lastWatchedAt DESC`
- [ ] `getUserResumePosition(userId, contentId)`: returns `{ positionMs, completionPercentage }` or `null`
- [ ] `getTrendingContent`, `getContentPerformanceMetrics`, `getUserGenreAffinities`: stub implementations that query repositories (can return empty until P2/P3 data exists)
- [ ] Decorated with `@Injectable()`

**Verify**: Unit test: mock repositories, verify each method returns expected shape

**Commit**: `feat(analytics): add AnalyticsFacade implementation`

---

#### T18: Create AnalyticsPublicApiModule

**What**: Module that provides the facade with `AnalyticsApi` symbol binding
**Where**: `package/analytics/public-api/analytics-public-api.module.ts`
**Depends on**: T17
**Requirement**: ANLYT-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Imports `AnalyticsSharedModule` (for repositories)
- [ ] Provides `{ provide: AnalyticsApi, useClass: AnalyticsFacade }`
- [ ] Exports `AnalyticsFacade` and `AnalyticsApi` token

**Verify**: Module compiles

**Commit**: `feat(analytics): wire public API module`

---

### Phase 5: Reporting — Admin Dashboard

#### T19: Create admin response DTOs [P]

**What**: Response DTOs for content performance, user engagement, trending
**Where**: `package/analytics/reporting/http/rest/dto/` (multiple files)
**Depends on**: T15
**Requirement**: ANLYT-06, ANLYT-07, ANLYT-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ContentPerformanceResponseDto` with `@Expose()` decorators for all fields
- [ ] `ContentPerformanceDetailResponseDto` with computed fields (`completionRate`, `avgWatchTimeMs`)
- [ ] `UserEngagementSummaryResponseDto` with `summary` and `timeSeries` structures
- [ ] `UserEngagementDetailResponseDto` with `topGenres` and `recentHistory` arrays
- [ ] `TrendingResponseDto` with `windowType`, `items` array
- [ ] `PaginatedResponseDto<T>` generic wrapper with `data`, `pagination` object

**Verify**: DTOs compile; `plainToInstance` correctly transforms

**Commit**: `feat(analytics): add admin dashboard response DTOs`

---

#### T20: Create admin query param DTOs [P]

**What**: Query param DTOs with validation for admin endpoints
**Where**: `package/analytics/reporting/http/rest/dto/` (multiple files)
**Depends on**: T15
**Requirement**: ANLYT-06, ANLYT-07, ANLYT-08

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ContentPerformanceQueryDto`: `page` (optional number, default 1), `limit` (optional number, default 20, max 100), `sortBy` (optional enum), `sortOrder` (optional ASC/DESC), `contentType` (optional enum), `from` (optional ISO date), `to` (optional ISO date)
- [ ] `UserEngagementQueryDto`: `from`, `to` (optional ISO dates), `granularity` (optional DAILY/WEEKLY/MONTHLY)
- [ ] `TrendingQueryDto`: `windowType` (optional DAILY/WEEKLY), `limit` (optional number), `contentType` (optional enum)
- [ ] `ExportQueryDto`: `from`, `to` (optional ISO dates), `contentType` (optional enum)
- [ ] `TopBottomContentQueryDto`: `limit`, `metric`, `contentType`, `from`, `to`
- [ ] All use `@Transform` for type coercion where needed

**Verify**: Validation rejects invalid inputs correctly

**Commit**: `feat(analytics): add admin query param DTOs`

---

#### T21: Create ReportingService

**What**: Service that orchestrates report queries with pagination, sorting, filtering
**Where**: `package/analytics/reporting/core/service/reporting.service.ts`
**Depends on**: T19, T20
**Requirement**: ANLYT-06, ANLYT-07, ANLYT-08, ANLYT-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `getContentPerformance(query)`: returns paginated, sorted content performance from repository
- [ ] `getContentPerformanceDetail(contentId)`: returns single content metrics with computed fields
- [ ] `getTopContent(query)` and `getBottomContent(query)`: return sorted lists
- [ ] `getUserEngagement(query)`: returns summary with aggregate metrics + time series array
- [ ] `getUserEngagementDetail(userId)`: returns per-user metrics, top genres, recent history
- [ ] `getTrending(query)`: returns latest trending rankings for window type
- [ ] All methods support `from`/`to` filtering when params are provided
- [ ] Pagination returns `totalItems` and `totalPages`

**Verify**: Unit test: mock repositories, verify pagination math and filtering logic

**Commit**: `feat(analytics): add reporting service`

---

#### T22: Create CsvExportService

**What**: Service that streams entity data to CSV format
**Where**: `package/analytics/reporting/core/service/csv-export.service.ts`
**Depends on**: T6
**Requirement**: ANLYT-10

**Tools**:
- MCP: `context7` (Node.js streams, csv-stringify or similar)
- Skill: NONE

**Done when**:
- [ ] `exportContentPerformance(query, response)`: queries data, pipes through CSV transform stream to HTTP response
- [ ] `exportUserEngagement(query, response)`: same pattern for user engagement data
- [ ] Sets `Content-Type: text/csv` and `Content-Disposition: attachment; filename="..."` headers
- [ ] Uses streaming to avoid loading full dataset into memory
- [ ] CSV includes proper column headers

**Verify**: Unit test: verify CSV output format; stream completes without error

**Commit**: `feat(analytics): add CSV export service`

---

#### T23: Create AdminAnalyticsController

**What**: REST controller with all admin dashboard endpoints
**Where**: `package/analytics/reporting/http/rest/controller/admin-analytics.controller.ts`
**Depends on**: T19, T20, T21, T22
**Reuses**: Lean controller pattern (< 20 lines per method)
**Requirement**: ANLYT-06, ANLYT-07, ANLYT-08, ANLYT-09, ANLYT-10

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `GET /analytics/admin/content-performance` → paginated list
- [ ] `GET /analytics/admin/content-performance/top` → top performing
- [ ] `GET /analytics/admin/content-performance/bottom` → bottom performing
- [ ] `GET /analytics/admin/content-performance/:contentId` → detail
- [ ] `GET /analytics/admin/user-engagement` → summary with time series
- [ ] `GET /analytics/admin/user-engagement/:userId` → per-user detail
- [ ] `GET /analytics/admin/trending` → trending list
- [ ] `GET /analytics/admin/export/content-performance` → CSV stream
- [ ] `GET /analytics/admin/export/user-engagement` → CSV stream
- [ ] All decorated with `@UseGuards(AuthGuard)` (AdminGuard added when available)
- [ ] All methods ≤ 15 lines, delegate to services
- [ ] Response DTOs applied via `plainToInstance` with `excludeExtraneousValues: true`

**Verify**: Controller compiles; all routes registered

**Commit**: `feat(analytics): add admin analytics REST controller`

---

#### T24: Create AnalyticsReportingModule

**What**: NestJS module wiring for the reporting subdomain
**Where**: `package/analytics/reporting/analytics-reporting.module.ts`
**Depends on**: T21, T22, T23
**Requirement**: ANLYT-06, ANLYT-07, ANLYT-08, ANLYT-09, ANLYT-10

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Imports `AnalyticsSharedModule`
- [ ] Provides `ReportingService`, `CsvExportService`
- [ ] Declares `AdminAnalyticsController`

**Verify**: Module compiles

**Commit**: `feat(analytics): wire reporting module`

---

### Phase 6: Root Module + App Integration

#### T25: Create root AnalyticsModule and index.ts

**What**: Root module that composes all subdomains; index.ts with exports
**Where**: `package/analytics/analytics.module.ts`, `package/analytics/index.ts`
**Depends on**: T11, T15, T18, T24
**Requirement**: All ANLYT-*

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `AnalyticsModule` imports: `AnalyticsSharedModule`, `AnalyticsIngestionModule`, `AnalyticsAggregationModule`, `AnalyticsReportingModule`, `AnalyticsPublicApiModule`, `AuthModule`, `LoggerModule`, `ConfigModule`
- [ ] Exports: `AnalyticsFacade`
- [ ] `index.ts` exports: `AnalyticsModule`, config, public enums (AnalyticsEventType, AnalyticsContentType)
- [ ] Does NOT export services, repositories, or internal modules

**Verify**: `nx lint:check analytics` passes

**Commit**: `feat(analytics): create root module and public exports`

---

#### T26: Generate database migration and register in app bootstrap

**What**: Generate TypeORM migration for all analytics entities; register `AnalyticsModule` in the app
**Where**: `package/analytics/shared/persistence/migration/`, app bootstrap file
**Depends on**: T25
**Requirement**: All ANLYT-*

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Migration generated via `nx db:generate analytics`
- [ ] Migration creates all 7 tables with correct columns, indexes, and constraints
- [ ] Migration runs successfully via `nx db:migrate analytics`
- [ ] `AnalyticsModule` registered in the main app module
- [ ] App starts without errors
- [ ] `nx build analytics` succeeds

**Verify**: `nx db:migrate analytics` completes; app boots and analytics endpoints respond

**Commit**: `feat(analytics): generate migration and register in app bootstrap`

---

### Phase 7: Trending

#### T27: Create TrendingComputationService

**What**: Service that computes time-windowed trending scores
**Where**: `package/analytics/aggregation/core/service/trending-computation.service.ts`
**Depends on**: T26
**Requirement**: ANLYT-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `computeWindow(windowType)`: queries `AnalyticsViewEvent` within window (24h for DAILY, 7d for WEEKLY), computes trending score per content using formula `(viewCount * 0.4) + (uniqueViewers * 0.4) + (avgCompletion * 0.2)`
- [ ] Ranks content by score descending
- [ ] Upserts `AnalyticsTrendingContent` for each `(contentId, windowType, windowStart)`
- [ ] Uses `@Transactional({ connectionName: 'analytics' })`

**Verify**: Unit test: seed events, run computation, verify rankings

**Commit**: `feat(analytics): add trending computation service`

---

#### T28: Create TrendingComputationConsumer

**What**: Scheduled BullMQ consumer that triggers trending recomputation
**Where**: `package/analytics/aggregation/queue/consumer/trending-computation.queue-consumer.ts`
**Depends on**: T27
**Requirement**: ANLYT-09

**Tools**:
- MCP: `context7` (BullMQ repeatable jobs)
- Skill: NONE

**Done when**:
- [ ] `@Processor(ANALYTICS_QUEUES.TRENDING_COMPUTATION)` with concurrency 1
- [ ] `process(job)`: dispatches to `trendingComputationService.computeWindow(job.data.windowType)`
- [ ] Registers repeatable jobs on module init: hourly for DAILY, every 6h for WEEKLY
- [ ] `@OnWorkerEvent('failed')`: logs error

**Verify**: Consumer compiles; repeatable job registration logic is correct

**Commit**: `feat(analytics): add trending computation scheduled consumer`

---

#### T29: Wire trending into aggregation module

**What**: Register trending service and consumer in aggregation module
**Where**: `package/analytics/aggregation/analytics-aggregation.module.ts`
**Depends on**: T28
**Requirement**: ANLYT-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `TrendingComputationService` and `TrendingComputationConsumer` added to providers
- [ ] Module compiles and app starts

**Verify**: Module compiles

**Commit**: `feat(analytics): register trending in aggregation module`

---

#### T30: Add trending endpoint to AdminAnalyticsController

**What**: Wire `GET /analytics/admin/trending` to reporting service
**Where**: `package/analytics/reporting/http/rest/controller/admin-analytics.controller.ts` (modify), `package/analytics/reporting/core/service/reporting.service.ts` (modify)
**Depends on**: T29
**Requirement**: ANLYT-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ReportingService.getTrending(query)` queries `TrendingContentRepository` for latest window
- [ ] Controller method uses `TrendingQueryDto` and returns `TrendingResponseDto`
- [ ] Endpoint responds with ranked list

**Verify**: Endpoint responds with correct JSON shape

**Commit**: `feat(analytics): add trending admin endpoint`

---

#### T31: Add trending to AnalyticsFacade

**What**: Implement `getTrendingContent` in the facade (replace stub)
**Where**: `package/analytics/public-api/facade/analytics.facade.ts` (modify)
**Depends on**: T29
**Requirement**: ANLYT-13

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `getTrendingContent(windowType, limit)` queries `TrendingContentRepository` and returns mapped results
- [ ] `getContentPerformanceMetrics(contentId)` queries `ContentPerformanceRepository` and returns or `null`

**Verify**: Unit test: verify facade returns trending data

**Commit**: `feat(analytics): implement trending and performance in facade`

---

### Phase 8: Advanced Analytics

#### T32: Create BingeDetectionService

**What**: Service that detects and manages binge sessions
**Where**: `package/analytics/aggregation/core/service/binge-detection.service.ts`
**Depends on**: T26
**Requirement**: ANLYT-11

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `evaluateBinge(userId, seriesContentId, occurredAt)`: triggered on COMPLETE for TV_EPISODE
- [ ] Queries recently completed episodes for user+series within gap threshold
- [ ] Creates `AnalyticsBingeSession` when 3+ episodes found within window
- [ ] Increments existing active session's `episodeCount` if still within threshold
- [ ] Closes session (sets `endedAt`) when gap exceeds threshold
- [ ] Uses configurable thresholds from `ConfigService`

**Verify**: Unit test: simulate 4 episodes within 2 hours → binge created; 2 episodes → no binge

**Commit**: `feat(analytics): add binge session detection service`

---

#### T33: Wire binge detection in EventAggregationConsumer

**What**: Call `BingeDetectionService` on COMPLETE events for TV_EPISODE content type
**Where**: `package/analytics/aggregation/queue/consumer/event-aggregation.queue-consumer.ts` (modify), `package/analytics/aggregation/analytics-aggregation.module.ts` (modify)
**Depends on**: T32
**Requirement**: ANLYT-11

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `EventAggregationConsumer.process()` checks if event is COMPLETE + TV_EPISODE → calls `bingeDetectionService.evaluateBinge()`
- [ ] `BingeDetectionService` added as provider in aggregation module
- [ ] Error in binge detection does not fail the overall aggregation job (try/catch with logging)

**Verify**: Consumer processes COMPLETE TV_EPISODE event → binge service called

**Commit**: `feat(analytics): wire binge detection in aggregation consumer`

---

#### T34: Add binge data to user engagement report

**What**: Include `totalBingeSessions` in engagement summary and per-user detail
**Where**: `package/analytics/reporting/core/service/reporting.service.ts` (modify)
**Depends on**: T33
**Requirement**: ANLYT-07, ANLYT-11

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `getUserEngagement()` summary includes `totalBingeSessions` count
- [ ] `getUserEngagementDetail(userId)` includes `bingeSessions` count for that user
- [ ] Binge data comes from `BingeSessionRepository`

**Verify**: Engagement endpoint returns binge count

**Commit**: `feat(analytics): include binge data in engagement reports`

---

#### T35: Create GenreAffinityService [P]

**What**: Service that recomputes per-user genre affinity scores
**Where**: `package/analytics/aggregation/core/service/genre-affinity.service.ts`
**Depends on**: T26
**Requirement**: ANLYT-12

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `recomputeAll()`: for each user active in last 30 days, group watch history by genre, compute weighted score (70% watch time, 30% content count), normalise to 0–100
- [ ] Upserts `AnalyticsGenreAffinity` for each `(userId, genre)`
- [ ] Genre data sourced from content module (or hardcoded mapping for initial implementation)
- [ ] Uses `@Transactional({ connectionName: 'analytics' })`

**Verify**: Unit test: seed watch history across 3 genres, verify scores

**Commit**: `feat(analytics): add genre affinity scoring service`

---

#### T36: Create GenreAffinityRecomputationConsumer

**What**: Scheduled BullMQ consumer for genre affinity recomputation
**Where**: `package/analytics/aggregation/queue/consumer/genre-affinity-recomputation.queue-consumer.ts`
**Depends on**: T35
**Requirement**: ANLYT-12

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `@Processor(ANALYTICS_QUEUES.GENRE_AFFINITY_RECOMPUTATION)` with concurrency 1
- [ ] `process(job)`: calls `genreAffinityService.recomputeAll()`
- [ ] Registers repeatable job on module init (every 6 hours)
- [ ] `@OnWorkerEvent('failed')`: logs error

**Verify**: Consumer compiles

**Commit**: `feat(analytics): add genre affinity scheduled consumer`

---

#### T37: Wire genre affinity into aggregation module and facade

**What**: Register genre affinity service and consumer; implement `getUserGenreAffinities` in facade
**Where**: `package/analytics/aggregation/analytics-aggregation.module.ts` (modify), `package/analytics/public-api/facade/analytics.facade.ts` (modify)
**Depends on**: T36
**Requirement**: ANLYT-12, ANLYT-13

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `GenreAffinityService` and `GenreAffinityRecomputationConsumer` added to aggregation module providers
- [ ] `AnalyticsFacade.getUserGenreAffinities(userId)` queries `GenreAffinityRepository`, returns sorted by score descending
- [ ] Module compiles and app starts

**Verify**: Facade method returns affinity data

**Commit**: `feat(analytics): wire genre affinity and complete facade`

---

#### T38: Verify all modules compile and app boots

**What**: Full build and lint check after all features are implemented
**Where**: Entire analytics package
**Depends on**: T34, T37
**Requirement**: All ANLYT-*

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `nx build analytics` succeeds
- [ ] `nx lint:check analytics` passes with no errors
- [ ] App starts and all endpoints respond
- [ ] No TypeScript errors

**Verify**: `nx build analytics && nx lint:check analytics`

**Commit**: No commit — verification only

---

### Phase 9: E2E Tests

#### T39: Create e2e test setup and helpers

**What**: Test bootstrap, database setup, helper functions for creating events and querying read models
**Where**: `package/analytics/test/`, `package/analytics/jest.config.ts`
**Depends on**: T38
**Reuses**: `package/shared/lib/test/test-e2e.setup.ts` patterns
**Requirement**: All ANLYT-*

**Tools**:
- MCP: `context7` (NestJS testing, supertest)
- Skill: `create-e2e-tests`

**Done when**:
- [ ] Test module bootstraps `AnalyticsModule` with test database
- [ ] Helper functions: `createPlayerEvent()`, `createHeartbeatBatch()`, `waitForQueueDrain()`
- [ ] Database is cleaned between tests
- [ ] Auth tokens can be generated for test users

**Verify**: Empty test suite runs without errors

**Commit**: `test(analytics): add e2e test setup and helpers`

---

#### T40: E2E tests — ingestion endpoints

**What**: Test event and heartbeat capture
**Where**: `package/analytics/test/ingestion.e2e-spec.ts`
**Depends on**: T39
**Requirement**: ANLYT-01, ANLYT-02

**Tools**:
- MCP: NONE
- Skill: `create-e2e-tests`

**Done when**:
- [ ] Test: POST valid event → 202, event persisted
- [ ] Test: POST event without auth → 401
- [ ] Test: POST event with invalid DTO → 400
- [ ] Test: POST heartbeat batch → 202, all heartbeats persisted, count returned
- [ ] Test: POST heartbeat with >= 90% position → COMPLETE job enqueued
- [ ] Test: POST empty heartbeat array → 400

**Verify**: `nx test:e2e analytics -- --testPathPattern=ingestion`

**Commit**: `test(analytics): add ingestion e2e tests`

---

#### T41: E2E tests — aggregation pipeline

**What**: Test that raw events are correctly aggregated into read models
**Where**: `package/analytics/test/aggregation.e2e-spec.ts`
**Depends on**: T39
**Requirement**: ANLYT-03, ANLYT-04, ANLYT-09, ANLYT-11, ANLYT-12

**Tools**:
- MCP: NONE
- Skill: `create-e2e-tests`

**Done when**:
- [ ] Test: PLAY event → watch history created with watchCount=1
- [ ] Test: STOP event → watch history position and completion updated
- [ ] Test: COMPLETE event → completed=true, content performance completionCount incremented
- [ ] Test: 3 users PLAY same content → uniqueViewers=3
- [ ] Test: 3+ episodes completed within threshold → binge session created
- [ ] Test: episodes with gap > threshold → no binge
- [ ] Test: trending computation produces ranked list

**Verify**: `nx test:e2e analytics -- --testPathPattern=aggregation`

**Commit**: `test(analytics): add aggregation e2e tests`

---

#### T42: E2E tests — admin dashboard

**What**: Test all admin reporting endpoints
**Where**: `package/analytics/test/reporting.e2e-spec.ts`
**Depends on**: T39
**Requirement**: ANLYT-06, ANLYT-07, ANLYT-08, ANLYT-09, ANLYT-10

**Tools**:
- MCP: NONE
- Skill: `create-e2e-tests`

**Done when**:
- [ ] Test: GET content performance → paginated response with correct shape
- [ ] Test: GET content performance with sortBy → correctly sorted
- [ ] Test: GET content performance with from/to → filtered by date range
- [ ] Test: GET top content → sorted descending by metric
- [ ] Test: GET bottom content → sorted ascending
- [ ] Test: GET content performance detail → includes computed fields
- [ ] Test: GET user engagement → summary with time series
- [ ] Test: GET user engagement detail → per-user with genres and history
- [ ] Test: GET trending → ranked list with scores
- [ ] Test: GET export CSV → Content-Type text/csv, valid CSV body
- [ ] Test: admin endpoints without auth → 401

**Verify**: `nx test:e2e analytics -- --testPathPattern=reporting`

**Commit**: `test(analytics): add admin dashboard e2e tests`

---

#### T43: E2E tests — public API facade and full integration

**What**: Test facade contract and end-to-end flow
**Where**: `package/analytics/test/facade.e2e-spec.ts`
**Depends on**: T39
**Requirement**: ANLYT-05, ANLYT-13

**Tools**:
- MCP: NONE
- Skill: `create-e2e-tests`

**Done when**:
- [ ] Test: getUserWatchHistory returns sorted history
- [ ] Test: getUserWatchHistory with completedOnly=true filters correctly
- [ ] Test: getUserResumePosition returns position for partial watch
- [ ] Test: getUserResumePosition returns null for unwatched content
- [ ] Test: getTrendingContent returns ranked list
- [ ] Test: getUserGenreAffinities returns scored genres
- [ ] Test: Full flow: POST PLAY → heartbeats → POST COMPLETE → wait for queue → verify all read models updated

**Verify**: `nx test:e2e analytics -- --testPathPattern=facade`

**Commit**: `test(analytics): add facade and integration e2e tests`

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: NX project config | 2-3 config files | ✅ Granular |
| T2: Config schema | 1 file | ✅ Granular |
| T3: Enums + queue constants | 4 files (same concern) | ✅ Granular |
| T4: Write model entities | 2 entities (same concern) | ✅ Granular |
| T5: Read model entities | 5 entities | ⚠️ Borderline — but all follow identical pattern, same concern |
| T6: Repositories + persistence + shared module | Multiple files | ⚠️ Grouped — repositories are mechanical; persistence+shared are coupled |
| T7: Ingestion DTOs | 2 DTOs | ✅ Granular |
| T8: Event producer | 1 class | ✅ Granular |
| T9: Ingestion service | 1 service | ✅ Granular |
| T10: Controller | 1 controller | ✅ Granular |
| T11-T15: Modules + aggregation services | 1 each | ✅ Granular |
| T16-T18: Facade chain | 1 each | ✅ Granular |
| T19-T24: Reporting chain | 1-2 each | ✅ Granular |
| T25-T26: Root + migration | Infrastructure | ✅ Granular |
| T27-T31: Trending chain | 1 each | ✅ Granular |
| T32-T38: Advanced + verification | 1 each | ✅ Granular |
| T39-T43: E2E tests | 1 test file each | ✅ Granular |

**Summary**: 43 tasks, 41 ✅ granular, 2 ⚠️ borderline but justified by cohesion
