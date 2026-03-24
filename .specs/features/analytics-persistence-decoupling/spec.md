# Analytics Persistence Decoupling Specification

## Problem Statement

The analytics module's `AnalyticsSharedPersistenceModule` acts as a monolithic shared kernel that registers and exports all 7 repositories and 7 entities to all 3 subdomains (ingestion, aggregation, reporting) indiscriminately. This violates the principle of ownership boundaries within subdomain-based modules: any subdomain can inject any repository, there is no control over who reads/writes what, and aggregation services cross into ingestion's write model by directly importing `ViewEventRepository`. The design doc claims "Light CQRS" but the shared persistence layer undermines that separation.

## Goals

- [ ] Each subdomain owns and registers only the entities and repositories it writes to
- [ ] Cross-subdomain data access happens through explicit internal facades, not shared repository injection
- [ ] The shared layer shrinks to pure infrastructure: DB connection config, queue config, and stable domain enums
- [ ] The CQRS boundary between ingestion (write) and aggregation (read) is enforced structurally
- [ ] Queue contract types live in a shared location, not inside a specific subdomain's internal code

## Out of Scope

| Feature | Reason |
|---|---|
| Separate TypeORM connections per subdomain | Over-engineering — one connection with separate repo registration is sufficient |
| Full Hexagonal / Ports & Adapters | Adds excessive boilerplate for a learning project without proportional benefit |
| Splitting into separate NX packages | Subdomains within a package don't need separate build targets |
| Changing the database schema or migrations | This is a code-level structural refactoring only |

---

## User Stories

### P1: Subdomain-Owned Persistence ⭐ MVP

**User Story**: As an architecture learner, I want each subdomain to own its entities and repositories so that ownership boundaries are explicit and enforced by the module system.

**Why P1**: This is the core refactoring — without it, the shared kernel anti-pattern remains.

**Acceptance Criteria**:

1. WHEN inspecting `AnalyticsIngestionModule` THEN it SHALL register `ViewEventRepository` and `HeartbeatRepository` as its own providers (not imported from shared)
2. WHEN inspecting `AnalyticsAggregationModule` THEN it SHALL register `UserWatchHistoryRepository`, `ContentPerformanceRepository`, `TrendingContentRepository`, `BingeSessionRepository`, and `GenreAffinityRepository` as its own providers
3. WHEN inspecting `AnalyticsSharedPersistenceModule` THEN it SHALL contain ONLY the TypeORM connection configuration — zero repository providers or exports
4. WHEN inspecting entity files THEN ingestion entities SHALL live under `ingestion/persistence/entity/` and aggregation entities under `aggregation/persistence/entity/`
5. WHEN `nx build analytics` is run THEN it SHALL succeed with no errors
6. WHEN `nx lint:check analytics` is run THEN it SHALL succeed with no errors

**Independent Test**: `nx build analytics` and `nx lint:check analytics` pass; e2e tests pass unchanged.

---

### P1: Cross-Subdomain Access via Internal Facade ⭐ MVP

**User Story**: As an architecture learner, I want cross-subdomain data reads to go through an explicit facade so that subdomain dependencies are visible and controlled.

**Why P1**: Without this, aggregation services would lose access to ingestion's `ViewEventRepository` data, breaking trending and genre affinity.

**Acceptance Criteria**:

1. WHEN `TrendingComputationService` needs view events THEN it SHALL call `IngestionReadFacade.findEventsInWindow()` instead of injecting `ViewEventRepository`
2. WHEN `GenreAffinityService` needs view events with genres THEN it SHALL call `IngestionReadFacade.findEventsWithGenresSince()` instead of injecting `ViewEventRepository`
3. WHEN inspecting `AnalyticsIngestionModule` THEN it SHALL export `IngestionReadFacade` for use by other subdomains
4. WHEN inspecting aggregation services THEN NONE SHALL import from `../../../shared/persistence/repository/`
5. WHEN inspecting ingestion services THEN NONE SHALL import from `../../../shared/persistence/repository/`

**Independent Test**: E2e tests for trending and genre affinity pass without changes.

---

### P1: Shared Contract Types ⭐ MVP

**User Story**: As an architecture learner, I want queue payload contracts in a shared location so that subdomains don't import each other's internal types.

**Why P1**: Currently `AnalyticsEventProcessingJobData` is defined inside ingestion's queue producer but imported by aggregation consumers — a direct cross-subdomain code dependency.

**Acceptance Criteria**:

1. WHEN inspecting `AnalyticsEventProcessingJobData` THEN it SHALL live under `shared/contract/`
2. WHEN inspecting aggregation consumers/services THEN they SHALL import the contract from `shared/contract/`, NOT from `ingestion/queue/producer/`
3. WHEN inspecting `EventProcessingProducer` THEN it SHALL import the contract from `shared/contract/`

**Independent Test**: Build succeeds; all imports resolve correctly.

---

### P2: Reporting Explicit Dependency

**User Story**: As an architecture learner, I want reporting's dependency on aggregation to be explicit so that the downstream read relationship is visible in the module graph.

**Why P2**: Improves clarity but not structurally critical — reporting already uses read-model repos.

**Acceptance Criteria**:

1. WHEN inspecting `AnalyticsReportingModule` THEN it SHALL import `AnalyticsAggregationModule` (not `AnalyticsSharedModule` for repo access)
2. WHEN inspecting `ReportingService` THEN its repository imports SHALL come from `aggregation/persistence/repository/` paths
3. WHEN the NestJS module graph is examined THEN the dependency `Reporting → Aggregation` SHALL be visible

**Independent Test**: E2e reporting tests pass unchanged.

---

## Edge Cases

- WHEN the TypeORM datasource factory scans for entities THEN it SHALL find entities in both `ingestion/persistence/entity/` and `aggregation/persistence/entity/` directories
- WHEN `nx db:generate analytics` is run THEN it SHALL still detect all entities for migration generation
- WHEN a developer mistakenly tries to inject `ViewEventRepository` in reporting THEN NestJS SHALL throw a provider-not-found error at startup (structural enforcement)

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| DECOUPLE-01 | P1: Subdomain-Owned Persistence | Tasks | Pending |
| DECOUPLE-02 | P1: Cross-Subdomain Access via Internal Facade | Tasks | Pending |
| DECOUPLE-03 | P1: Shared Contract Types | Tasks | Pending |
| DECOUPLE-04 | P2: Reporting Explicit Dependency | Tasks | Pending |

**Coverage:** 4 total, 4 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] `nx build analytics` succeeds
- [ ] `nx lint:check analytics` succeeds
- [ ] `nx test:e2e analytics` passes (all existing e2e tests)
- [ ] `AnalyticsSharedPersistenceModule` has zero repository providers/exports
- [ ] No aggregation service imports from `shared/persistence/repository/`
- [ ] No ingestion service imports from `shared/persistence/repository/`
- [ ] `IngestionReadFacade` is the only way aggregation accesses ingestion data
- [ ] `AnalyticsEventProcessingJobData` lives in `shared/contract/`
