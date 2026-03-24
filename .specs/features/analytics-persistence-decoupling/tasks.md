# Analytics Persistence Decoupling Tasks

**Spec**: `.specs/features/analytics-persistence-decoupling/spec.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Shared Contracts (Sequential)

Extract shared types before moving anything.

```
T1 → T2
```

### Phase 2: Move Persistence to Owning Subdomains (Sequential)

Move entities and repositories, update datasource factory, register in subdomain modules.

```
T2 → T3 → T4 → T5 → T6 → T7
```

### Phase 3: Internal Facade + Service Rewiring (Sequential, then Parallel)

Create ingestion facade, then rewire aggregation services in parallel.

```
        ┌→ T9  ─┐
T8 ─────┼→ T10 ─┤
        └→ T11 ─┘
```

### Phase 4: Reporting Rewiring (Sequential)

Make reporting's dependency on aggregation explicit.

```
T12 → T13
```

### Phase 5: Cleanup & Verification (Sequential)

Shrink shared module, verify everything.

```
T14 → T15 → T16
```

---

## Task Breakdown

### T1: Extract queue contract types to shared

**What**: Move `AnalyticsEventProcessingJobData` interface from `ingestion/queue/producer/event-processing.queue-producer.ts` to `shared/contract/event-processing-job.contract.ts`. Re-export from the producer file for backward compat during migration.
**Where**: `package/analytics/shared/contract/event-processing-job.contract.ts` (new), `package/analytics/ingestion/queue/producer/event-processing.queue-producer.ts` (modify)
**Depends on**: None
**Requirement**: DECOUPLE-03

**Done when**:

- [ ] `AnalyticsEventProcessingJobData` is defined in `shared/contract/`
- [ ] `EventProcessingProducer` imports from `shared/contract/`
- [ ] No TypeScript errors

**Commit**: `refactor(analytics): extract queue contract types to shared`

---

### T2: Update aggregation imports to use shared contract

**What**: Update all aggregation services and consumers that import `AnalyticsEventProcessingJobData` from `ingestion/queue/producer/` to import from `shared/contract/` instead.
**Where**: `package/analytics/aggregation/core/service/watch-history-aggregation.service.ts`, `package/analytics/aggregation/core/service/content-performance-aggregation.service.ts`, `package/analytics/aggregation/queue/consumer/event-aggregation.queue-consumer.ts`
**Depends on**: T1
**Requirement**: DECOUPLE-03

**Done when**:

- [ ] Zero aggregation files import from `../../../ingestion/`
- [ ] All aggregation files import contract from `../../../shared/contract/`
- [ ] No TypeScript errors

**Commit**: `refactor(analytics): use shared contract in aggregation imports`

---

### T3: Move ingestion entities to ingestion/persistence/entity

**What**: Move `analytics-view-event.entity.ts` and `analytics-heartbeat.entity.ts` from `shared/persistence/entity/` to `ingestion/persistence/entity/`.
**Where**: `package/analytics/ingestion/persistence/entity/` (new directory)
**Depends on**: T2
**Requirement**: DECOUPLE-01

**Done when**:

- [ ] Both entity files exist under `ingestion/persistence/entity/`
- [ ] Files are removed from `shared/persistence/entity/`
- [ ] No TypeScript errors (imports will be fixed in T5)

**Commit**: `refactor(analytics): move ingestion entities to subdomain`

---

### T4: Move ingestion repositories to ingestion/persistence/repository

**What**: Move `view-event.repository.ts` and `heartbeat.repository.ts` from `shared/persistence/repository/` to `ingestion/persistence/repository/`.
**Where**: `package/analytics/ingestion/persistence/repository/` (new directory)
**Depends on**: T3
**Requirement**: DECOUPLE-01

**Done when**:

- [ ] Both repository files exist under `ingestion/persistence/repository/`
- [ ] Files are removed from `shared/persistence/repository/`
- [ ] Repository entity imports updated to relative `../entity/` path
- [ ] No TypeScript errors (module registration in T5)

**Commit**: `refactor(analytics): move ingestion repositories to subdomain`

---

### T5: Move aggregation entities and repositories to aggregation/persistence

**What**: Move the 5 aggregation entities (`analytics-user-watch-history`, `analytics-content-performance`, `analytics-trending-content`, `analytics-binge-session`, `analytics-genre-affinity`) and their 5 repositories from `shared/persistence/` to `aggregation/persistence/`.
**Where**: `package/analytics/aggregation/persistence/entity/` (new), `package/analytics/aggregation/persistence/repository/` (new)
**Depends on**: T4
**Requirement**: DECOUPLE-01

**Done when**:

- [ ] All 5 entity files under `aggregation/persistence/entity/`
- [ ] All 5 repository files under `aggregation/persistence/repository/`
- [ ] Files removed from `shared/persistence/entity/` and `shared/persistence/repository/`
- [ ] Repository entity imports updated to relative `../entity/` paths
- [ ] `shared/persistence/entity/` and `shared/persistence/repository/` directories are empty or removed

**Commit**: `refactor(analytics): move aggregation entities and repos to subdomain`

---

### T6: Update TypeORM datasource factory entity paths

**What**: Update `typeorm-datasource.factory.ts` to scan entity directories in both `ingestion/persistence/entity/` and `aggregation/persistence/entity/` instead of the now-empty `shared/persistence/entity/`.
**Where**: `package/analytics/shared/persistence/typeorm-datasource.factory.ts`
**Depends on**: T5
**Requirement**: DECOUPLE-01

**Done when**:

- [ ] `entities` array includes paths to both `ingestion/persistence/entity/` and `aggregation/persistence/entity/`
- [ ] No TypeScript errors
- [ ] `nx db:generate analytics` still detects all entities (if DB available)

**Commit**: `refactor(analytics): update datasource entity paths for subdomain layout`

---

### T7: Register repositories in subdomain modules and update service imports

**What**: Update `AnalyticsIngestionModule` to register its 2 repositories as providers. Update `AnalyticsAggregationModule` to register its 5 repositories as providers. Update all service imports across ingestion, aggregation, and reporting to use the new relative paths. Remove repository registrations from `AnalyticsSharedPersistenceModule`.
**Where**: `package/analytics/ingestion/analytics-ingestion.module.ts`, `package/analytics/aggregation/analytics-aggregation.module.ts`, `package/analytics/shared/persistence/analytics-persistence.module.ts`, all service files with `shared/persistence/` imports
**Depends on**: T6
**Reuses**: Existing module registration patterns from billing
**Requirement**: DECOUPLE-01

**Done when**:

- [ ] `AnalyticsIngestionModule` providers include `ViewEventRepository`, `HeartbeatRepository`
- [ ] `AnalyticsAggregationModule` providers include all 5 read-model repositories
- [ ] `AnalyticsSharedPersistenceModule` has zero repository providers/exports
- [ ] All service entity/repository imports use subdomain-relative paths
- [ ] `nx build analytics` succeeds
- [ ] `nx lint:check analytics` succeeds

**Commit**: `refactor(analytics): register repos in owning subdomain modules`

---

### T8: Create IngestionReadFacade

**What**: Create `IngestionReadFacade` that exposes read-only methods for data that aggregation needs from ingestion's write model: `findEventsInWindow(start, end)` and `findEventsWithGenresSince(date)`. Register in `AnalyticsIngestionModule` and export it.
**Where**: `package/analytics/ingestion/public-api/facade/ingestion-read.facade.ts` (new), `package/analytics/ingestion/analytics-ingestion.module.ts` (modify)
**Depends on**: T7
**Reuses**: Facade pattern from `aggregation/public-api/facade/aggregation.facade.ts`
**Requirement**: DECOUPLE-02

**Done when**:

- [ ] `IngestionReadFacade` exists with `findEventsInWindow` and `findEventsWithGenresSince` methods
- [ ] Methods delegate to `ViewEventRepository` (pure delegation, no logic)
- [ ] `AnalyticsIngestionModule` exports `IngestionReadFacade`
- [ ] No TypeScript errors

**Commit**: `refactor(analytics): create ingestion read facade for cross-subdomain access`

---

### T9: Rewire TrendingComputationService to use IngestionReadFacade [P]

**What**: Replace `ViewEventRepository` injection with `IngestionReadFacade` in `TrendingComputationService`.
**Where**: `package/analytics/aggregation/core/service/trending-computation.service.ts`
**Depends on**: T8
**Requirement**: DECOUPLE-02

**Done when**:

- [ ] Service injects `IngestionReadFacade` instead of `ViewEventRepository`
- [ ] `findInWindow` call goes through facade
- [ ] No import from `ingestion/` or `shared/persistence/repository/view-event`
- [ ] No TypeScript errors

**Commit**: `refactor(analytics): use ingestion facade in trending computation`

---

### T10: Rewire GenreAffinityService to use IngestionReadFacade [P]

**What**: Replace `ViewEventRepository` injection with `IngestionReadFacade` in `GenreAffinityService`.
**Where**: `package/analytics/aggregation/core/service/genre-affinity.service.ts`
**Depends on**: T8
**Requirement**: DECOUPLE-02

**Done when**:

- [ ] Service injects `IngestionReadFacade` instead of `ViewEventRepository`
- [ ] `findWithGenresSince` call goes through facade
- [ ] No import from `ingestion/` or `shared/persistence/repository/view-event`
- [ ] No TypeScript errors

**Commit**: `refactor(analytics): use ingestion facade in genre affinity`

---

### T11: Update remaining aggregation service imports [P]

**What**: Update entity and repository imports in `WatchHistoryAggregationService`, `ContentPerformanceAggregationService`, `BingeDetectionService`, `AggregationQueryService`, and `AggregationFacade` to use the new `aggregation/persistence/` paths instead of `shared/persistence/`.
**Where**: All aggregation service and facade files
**Depends on**: T8
**Requirement**: DECOUPLE-01, DECOUPLE-02

**Done when**:

- [ ] Zero aggregation files import from `../../../shared/persistence/`
- [ ] All entity imports use `../../persistence/entity/` or `../../../aggregation/persistence/entity/` relative paths
- [ ] All repository imports use `../../persistence/repository/` or `../../../aggregation/persistence/repository/` relative paths
- [ ] No TypeScript errors

**Commit**: `refactor(analytics): update aggregation imports to subdomain paths`

---

### T12: Wire reporting to import aggregation module explicitly

**What**: Update `AnalyticsReportingModule` to import `AnalyticsAggregationModule` instead of relying on `AnalyticsSharedModule` for repository access. Update `AnalyticsAggregationModule` to export the repositories reporting needs.
**Where**: `package/analytics/reporting/analytics-reporting.module.ts`, `package/analytics/aggregation/analytics-aggregation.module.ts`
**Depends on**: T11
**Requirement**: DECOUPLE-04

**Done when**:

- [ ] `AnalyticsReportingModule` imports `AnalyticsAggregationModule`
- [ ] `AnalyticsAggregationModule` exports its read-model repositories
- [ ] Reporting services can still inject all needed repositories
- [ ] No TypeScript errors

**Commit**: `refactor(analytics): make reporting dependency on aggregation explicit`

---

### T13: Update reporting service imports to aggregation paths

**What**: Update `ReportingService` and `CsvExportService` entity/repository imports to use `aggregation/persistence/` paths instead of `shared/persistence/`.
**Where**: `package/analytics/reporting/core/service/reporting.service.ts`, `package/analytics/reporting/core/service/csv-export.service.ts`
**Depends on**: T12
**Requirement**: DECOUPLE-04

**Done when**:

- [ ] Zero reporting files import from `../../../shared/persistence/`
- [ ] All entity/repository imports reference `../../../aggregation/persistence/`
- [ ] No TypeScript errors

**Commit**: `refactor(analytics): update reporting imports to aggregation paths`

---

### T14: Shrink AnalyticsSharedModule and persistence module

**What**: Remove all repository registrations from `AnalyticsSharedPersistenceModule`. Clean up `AnalyticsSharedModule` exports. Remove empty `shared/persistence/entity/` and `shared/persistence/repository/` directories if empty.
**Where**: `package/analytics/shared/persistence/analytics-persistence.module.ts`, `package/analytics/shared/analytics-shared.module.ts`
**Depends on**: T13
**Requirement**: DECOUPLE-01

**Done when**:

- [ ] `AnalyticsSharedPersistenceModule` has zero repository providers/exports — only TypeORM connection
- [ ] `AnalyticsSharedModule` still exports `AnalyticsSharedPersistenceModule` (for connection) and `BullModule`
- [ ] Empty `shared/persistence/entity/` and `shared/persistence/repository/` directories removed
- [ ] No TypeScript errors

**Commit**: `refactor(analytics): shrink shared module to infrastructure only`

---

### T15: Update test factories and public-api facade imports

**What**: Update import paths in test factories (`__test__/factory/`), the root `AnalyticsFacade`, and the `index.ts` to reflect the new file locations.
**Where**: `package/analytics/__test__/factory/`, `package/analytics/public-api/facade/analytics.facade.ts`, `package/analytics/index.ts`
**Depends on**: T14
**Requirement**: DECOUPLE-01

**Done when**:

- [ ] All test factory imports resolve correctly
- [ ] `AnalyticsFacade` imports resolve correctly
- [ ] `index.ts` exports still work
- [ ] No TypeScript errors

**Commit**: `refactor(analytics): update test and public-api imports`

---

### T16: Verify build, lint, and e2e tests

**What**: Run full verification suite to confirm the refactoring is complete and nothing is broken.
**Where**: Project root
**Depends on**: T15
**Requirement**: DECOUPLE-01, DECOUPLE-02, DECOUPLE-03, DECOUPLE-04

**Done when**:

- [ ] `nx build analytics` succeeds
- [ ] `nx lint:check analytics` succeeds
- [ ] `nx test:e2e analytics` passes (all existing tests)
- [ ] No aggregation/reporting file imports from `shared/persistence/repository/`
- [ ] No aggregation file imports from `ingestion/` (except via `IngestionReadFacade`)

**Verify**:

```bash
nx build analytics
nx lint:check analytics
nx test:e2e analytics
# Verify no shared persistence repo imports remain in subdomains
rg "shared/persistence/repository" package/analytics/ingestion/ package/analytics/aggregation/ package/analytics/reporting/
# Verify no direct ingestion imports in aggregation (except facade)
rg "from.*ingestion/" package/analytics/aggregation/ | grep -v "IngestionReadFacade"
```

**Commit**: `refactor(analytics): verify persistence decoupling complete`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2

Phase 2 (Sequential):
  T2 ──→ T3 ──→ T4 ──→ T5 ──→ T6 ──→ T7

Phase 3 (Sequential + Parallel):
  T7 ──→ T8, then:
    ├── T9  [P]
    ├── T10 [P]  } Can run simultaneously
    └── T11 [P]

Phase 4 (Sequential):
  T9, T10, T11 complete, then:
    T12 ──→ T13

Phase 5 (Sequential):
  T13 ──→ T14 ──→ T15 ──→ T16
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: Extract contract type | 1 new file + 1 modify | Granular |
| T2: Update aggregation imports | 3 files (import path change) | Granular |
| T3: Move ingestion entities | 2 file moves | Granular |
| T4: Move ingestion repos | 2 file moves + import fix | Granular |
| T5: Move aggregation entities+repos | 10 file moves + import fix | Borderline — cohesive batch |
| T6: Update datasource factory | 1 file modify | Granular |
| T7: Register repos in modules + update imports | 3 modules + all services | Larger — but cohesive atomic commit |
| T8: Create IngestionReadFacade | 1 new file + 1 module modify | Granular |
| T9: Rewire trending service | 1 file modify | Granular |
| T10: Rewire genre affinity service | 1 file modify | Granular |
| T11: Update aggregation imports | ~5 files (import path) | Granular |
| T12: Wire reporting module | 2 module files | Granular |
| T13: Update reporting imports | 2 service files | Granular |
| T14: Shrink shared module | 2 module files + cleanup | Granular |
| T15: Update test/public-api imports | 4-5 files | Granular |
| T16: Verify all | Commands only | Granular |

**Summary**: 16 tasks, 14 granular, 2 borderline (T5 batches cohesive moves, T7 batches cohesive module rewiring).
