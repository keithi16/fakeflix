# Core Personalization Tasks

**Design**: `.specs/features/core-personalization/design.md`
**Status**: Complete

---

## Execution Plan

### Phase 1: Prerequisites (T1→T2→T3, T4 parallel)

```
T1 → T2 → T3
T4 ──────────→  [P] (parallel with T1-T3)
```

### Phase 2: Persistence (Sequential, depends on T4)

```
T4 → T5
```

### Phase 3: Core Services (T6 ∥ T7, then T8 sequential)

```
         ┌→ T6 [P] → T8 ──┐
T3+T5 ──→┤                 ├──→ Phase 4
         └→ T7 [P] ────────┘
```

### Phase 4: Integration (Sequential, depends on T7+T8)

```
T9 → T10
```

---

## Task Breakdown

### T1: Add `genres` column to Content entity

**What**: Add `genres: string[]` (jsonb, default `[]`) column to the abstract `Content` entity and generate the migration.
**Where**: `package/content/shared/persistence/entity/content.entity.ts`
**Depends on**: None
**Reuses**: Existing entity patterns (`@Column('jsonb', { default: [] })`)
**Requirement**: AD-003 (prerequisite for REC-02)

**Done when**:

- [ ] `Content` entity has `genres: string[]` column with `@Column('jsonb', { default: [] })`
- [ ] Migration generated via `nx db:generate content`
- [ ] Migration runs successfully via `nx db:migrate content`
- [ ] Existing content e2e tests still pass
- [ ] Gate check passes: `nx run content:test:e2e`

**Tests**: e2e (existing tests must not break)
**Gate**: full — `nx run content:test:e2e`

**Commit**: `feat(content): add genres column to Content entity`

---

### T2: Create `ContentCatalogApi` shared interface

**What**: Define the `ContentCatalogApi` interface, `ContentCatalogItem` type, and Symbol injection token in the shared public-api module.
**Where**: `package/shared/module/public-api/interface/content-catalog-public-api.interface.ts`
**Depends on**: T1
**Reuses**: `AnalyticsApi` interface pattern in same directory
**Requirement**: AD-003

**Done when**:

- [ ] `ContentCatalogApi` interface with `findAllWithGenres(): Promise<ContentCatalogItem[]>`
- [ ] `ContentCatalogItem` type with `id`, `title`, `type`, `genres`, `releaseDate`
- [ ] `ContentCatalogApi` Symbol token exported
- [ ] Re-exported from `package/shared/module/public-api/index.ts`
- [ ] No TypeScript errors
- [ ] Gate check passes: `nx lint:check shared-module`

**Tests**: none (interface only)
**Gate**: quick — `nx lint:check shared-module`

**Commit**: `feat(shared-module): add ContentCatalogApi interface`

---

### T3: Implement `ContentCatalogFacade`

**What**: Create a facade in the content catalog module that implements `ContentCatalogApi` by querying content with genres from the repository. Register and export from `ContentModule`.
**Where**: `package/content/catalog/public-api/facade/content-catalog.facade.ts`
**Depends on**: T1, T2
**Reuses**: `AnalyticsFacade` pattern, `ContentRepository` from content management module
**Requirement**: AD-003

**Done when**:

- [ ] `ContentCatalogFacade` implements `ContentCatalogApi`
- [ ] `findAllWithGenres()` queries content repository and maps to `ContentCatalogItem[]`
- [ ] Registered in `ContentCatalogModule` as provider
- [ ] `ContentModule` exports `ContentCatalogApi` token via `{ provide: ContentCatalogApi, useClass: ContentCatalogFacade }`
- [ ] Existing content e2e tests still pass
- [ ] Gate check passes: `nx run content:test:e2e`

**Tests**: e2e (existing tests must not break)
**Gate**: full — `nx run content:test:e2e`

**Commit**: `feat(content): add ContentCatalogFacade for cross-module catalog queries`

---

### T4: Scaffold `@tlc/recommendations` package [P]

**What**: Create the full workspace structure for the recommendations package — `package.json`, `project.json` (with `test:unit`, `test:e2e`, `db:generate`, `db:migrate`, `lint:check` targets), Jest config, TypeScript configs, Zod config schema, empty module, barrel file. Add to root workspaces.
**Where**: `package/recommendations/`
**Depends on**: None
**Reuses**: `@tlc/analytics` package structure as template
**Requirement**: Foundation for all REC/CW requirements

**Done when**:

- [ ] `package/recommendations/package.json` with name `@tlc/recommendations`
- [ ] `package/recommendations/project.json` with targets: `test:unit`, `test:e2e`, `db:generate`, `db:migrate`, `lint:check`, `lint:fix`
- [ ] `package/recommendations/jest.config.ts` extending preset
- [ ] `package/recommendations/tsconfig.json`, `tsconfig.lib.json`, `tsconfig.spec.json`
- [ ] `package/recommendations/config.ts` with Zod schema (database + Redis config)
- [ ] `package/recommendations/index.ts` exporting module + config
- [ ] `package/recommendations/recommendations.module.ts` (empty shell)
- [ ] Added to root `package.json` workspaces array
- [ ] `yarn install` succeeds
- [ ] Gate check passes: `nx lint:check recommendations`

**Tests**: none (scaffold only)
**Gate**: quick — `nx lint:check recommendations`

**Commit**: `feat(recommendations): scaffold package with workspace config`

---

### T5: Recommendations persistence layer

**What**: Create entities (`PreComputedRecommendation`, `ContinueWatchingDismiss`), repositories, persistence module with named `recommendations` datasource, and TypeORM datasource factory. Generate migration.
**Where**: `package/recommendations/persistence/`
**Depends on**: T4
**Reuses**: `DefaultTypeOrmRepository`, `DefaultEntity`, `TypeOrmPersistenceModule.forRoot`, billing persistence module as pattern
**Requirement**: Foundation for REC-01, CW-05

**Done when**:

- [ ] `PreComputedRecommendation` entity with userId, contentId, score, rank, matchedGenres, computedAt + indexes
- [ ] `ContinueWatchingDismiss` entity with userId, contentId, dismissedAt + indexes
- [ ] `PreComputedRecommendationRepository` extends `DefaultTypeOrmRepository` with `findByUserId`, `replaceForUser`, `getDistinctUserIds`
- [ ] `ContinueWatchingDismissRepository` extends `DefaultTypeOrmRepository` with `findByUserId`, `dismiss`
- [ ] `RecommendationsPersistenceModule` with `TypeOrmPersistenceModule.forRoot` using `recommendations` datasource
- [ ] `typeorm-datasource.ts` + `typeorm-datasource.factory.ts` following billing pattern
- [ ] Migration generated via `nx db:generate recommendations`
- [ ] Migration runs successfully via `nx db:migrate recommendations`
- [ ] Gate check passes: `nx lint:check recommendations`

**Tests**: none (tested via e2e in T10)
**Gate**: quick — `nx lint:check recommendations`

**Commit**: `feat(recommendations): add persistence layer with entities and repositories`

---

### T6: `RecommendationComputationService` + unit tests [P]

**What**: Implement the core scoring logic: compute personalized recommendations for a user by matching genre affinities to content catalog, excluding completed content, scoring, ranking, and storing results. Implement batch `recomputeAll()`.
**Where**: `package/recommendations/core/service/recommendation-computation.service.ts`
**Depends on**: T2 (ContentCatalogApi types), T3 (facade exists), T5 (repository)
**Reuses**: `AnalyticsApi` types from `@tlc/shared-module/public-api`
**Requirement**: REC-01, REC-02, REC-04, REC-05, REC-07, REC-09

**Done when**:

- [ ] `computeForUser(userId)` fetches genre affinities + watch history + catalog, scores, filters, returns top 20
- [ ] Scoring: `score = sum(affinityScore for each matching genre)` — items with score 0 excluded
- [ ] Completed content (>= 90%) excluded from results
- [ ] Results stored via `PreComputedRecommendationRepository.replaceForUser`
- [ ] `recomputeAll()` gets distinct userIds from repository, recomputes each
- [ ] Returns fewer than 20 items if catalog doesn't have enough matches (REC-07)
- [ ] Unit tests cover: scoring with multiple genres, completed content exclusion, empty affinities, empty catalog, partial results
- [ ] Gate check passes: `nx run recommendations:test:unit`
- [ ] Test count: >= 6 unit tests pass

**Tests**: unit
**Gate**: quick — `nx run recommendations:test:unit`

**Commit**: `feat(recommendations): implement scoring engine with genre-affinity matching`

---

### T7: `ContinueWatchingService` + unit tests [P]

**What**: Implement continue watching logic: fetch watch history from analytics, filter to partially watched, exclude dismissed items, sort by recency, limit to 20, enrich with resume positions.
**Where**: `package/recommendations/core/service/continue-watching.service.ts`
**Depends on**: T5 (dismiss repository)
**Reuses**: `AnalyticsApi` types from `@tlc/shared-module/public-api`
**Requirement**: CW-01, CW-02, CW-03, CW-04, CW-05, CW-06, CW-07

**Done when**:

- [ ] `getForUser(userId)` filters watch history to > 5% and < 90% completion
- [ ] Dismissed items excluded via `ContinueWatchingDismissRepository`
- [ ] Sorted by `lastWatchedAt` descending
- [ ] Limited to 20 items
- [ ] Each item enriched with resume position from `AnalyticsApi.getUserResumePosition`
- [ ] `dismissItem(userId, contentId)` persists dismiss record
- [ ] Returns empty array when no partially-watched content (CW-06)
- [ ] Unit tests cover: partial watch filtering, dismiss exclusion, limit 20, resume enrichment, empty history, dismiss persistence
- [ ] Gate check passes: `nx run recommendations:test:unit`
- [ ] Test count: >= 6 unit tests pass

**Tests**: unit
**Gate**: quick — `nx run recommendations:test:unit`

**Commit**: `feat(recommendations): implement continue watching with dismiss support`

---

### T8: `PersonalizedRecommendationService` + unit tests

**What**: Implement the orchestration layer: check pre-computed cache, compute on miss, fall back to trending for anonymous/new users, handle analytics errors gracefully.
**Where**: `package/recommendations/core/service/personalized-recommendation.service.ts`
**Depends on**: T5 (repository), T6 (computation service)
**Reuses**: `AnalyticsApi` trending fallback
**Requirement**: REC-01, REC-03, REC-06, REC-08

**Done when**:

- [ ] `getForUser(null)` returns trending content (REC-06)
- [ ] `getForUser(userId)` returns pre-computed results on cache hit
- [ ] `getForUser(userId)` triggers computation on cache miss, stores, returns
- [ ] Falls back to trending when user has no genre affinities (REC-03)
- [ ] Falls back to trending when analytics API throws (REC-08)
- [ ] Unit tests cover: cache hit, cache miss + compute, anonymous user, new user (no affinities), analytics error fallback
- [ ] Gate check passes: `nx run recommendations:test:unit`
- [ ] Test count: >= 5 unit tests pass

**Tests**: unit
**Gate**: quick — `nx run recommendations:test:unit`

**Commit**: `feat(recommendations): implement personalized recommendation orchestration`

---

### T9: Response DTOs + `RecommendationsController`

**What**: Create response DTOs and the REST controller with 3 endpoints: get personalized recommendations, get continue watching, dismiss continue watching item.
**Where**: `package/recommendations/http/rest/controller/recommendations.controller.ts`, `package/recommendations/http/rest/dto/`
**Depends on**: T7, T8
**Reuses**: `AuthGuard`, `ClsService`, `plainToInstance` with `@Expose()` pattern, `ValidationPipe`
**Requirement**: REC-01, REC-06, CW-01, CW-03, CW-05

**Done when**:

- [ ] `RecommendationItemResponseDto` with `@Expose()`: contentId, title, type, score, rank, genres
- [ ] `ContinueWatchingItemResponseDto` with `@Expose()`: contentId, title, type, completionPercentage, resumePositionMs, lastWatchedAt
- [ ] `GET /recommendations` — optional auth, delegates to `PersonalizedRecommendationService`
- [ ] `GET /recommendations/continue-watching` — required auth, delegates to `ContinueWatchingService`
- [ ] `DELETE /recommendations/continue-watching/:contentId` — required auth, 204 No Content
- [ ] Controller is lean: no business logic, only delegation + DTO mapping
- [ ] Gate check passes: `nx lint:check recommendations`

**Tests**: none (tested via e2e in T10)
**Gate**: quick — `nx lint:check recommendations`

**Commit**: `feat(recommendations): add REST controller with recommendation endpoints`

---

### T10: Queue consumer + module wiring + monolith integration + e2e tests

**What**: Create the BullMQ queue consumer, wire the full `RecommendationsModule`, integrate into the monolith app, and write comprehensive e2e tests covering all acceptance criteria. E2e tests are co-located with wiring because the controller (T9) and all services (T6–T8) are untested at the HTTP level until the module is assembled — verification must be immediate, not deferred.
**Where**: `package/recommendations/queue/consumer/recommendation-computation.queue-consumer.ts`, `package/recommendations/recommendations.module.ts`, `app/monolith/monolith.module.ts`, `app/monolith/config.ts`, `package/recommendations/__test__/e2e/recommendations/`, `package/recommendations/__test__/factory/`
**Depends on**: T9
**Reuses**: `TrendingComputationQueueConsumer` pattern from analytics, `MonolithModule` config merge pattern, `createNestApp` from `@tlc/shared-lib/test`, `Tables` enum, JWT mock pattern, Knex cleanup, factory.ts patterns
**Requirement**: REC-01 through REC-09, CW-01 through CW-07, REC-05

**Done when**:

- [ ] `RecommendationComputationQueueConsumer` with repeatable daily job, delegates to `RecommendationComputationService.recomputeAll()`
- [ ] Queue constant defined (e.g. `QUEUES.RECOMMENDATION_COMPUTATION`)
- [ ] `RecommendationsModule` wires: persistence module, BullMQ queue, all services, controller, queue consumer
- [ ] `MonolithModule` imports `RecommendationsModule`
- [ ] `recommendationsConfigFactory` added to monolith `ConfigModule.forRoot({ load: [...] })`
- [ ] `.env.local` updated with `RECOMMENDATIONS_DATABASE_*` and `RECOMMENDATIONS_REDIS_*` vars
- [ ] `nx build monolith` succeeds
- [ ] Test factories for `PreComputedRecommendation` and `ContinueWatchingDismiss`
- [ ] `Tables` enum updated with recommendation table names
- [ ] E2e test: logged-in user with affinities gets personalized results (REC-01, REC-02)
- [ ] E2e test: new user with no history gets trending fallback (REC-03)
- [ ] E2e test: completed content excluded from personalized row (REC-04)
- [ ] E2e test: anonymous user gets trending (REC-06)
- [ ] E2e test: fewer than 20 matching items returns partial results (REC-07)
- [ ] E2e test: continue watching returns partially-watched items with resume position (CW-01, CW-03)
- [ ] E2e test: completed content not in continue watching (CW-02)
- [ ] E2e test: continue watching capped at 20 (CW-04)
- [ ] E2e test: dismissed item excluded from continue watching (CW-05)
- [ ] E2e test: dismiss endpoint returns 204 (CW-05)
- [ ] E2e test: empty continue watching returns empty array (CW-06)
- [ ] Gate check passes: `nx run recommendations:test:e2e`
- [ ] Build gate passes: `nx build monolith && nx lint:check recommendations && nx run recommendations:test:unit && nx run recommendations:test:e2e`
- [ ] Test count: >= 12 e2e tests pass

**Tests**: e2e
**Gate**: build — `nx build monolith && nx lint:check recommendations && nx run recommendations:test:unit && nx run recommendations:test:e2e`

**Commit**: `feat(recommendations): wire module with batch job, monolith integration, and e2e tests`

---

## Parallel Execution Map

```
Phase 1 (Prerequisites):
  T1 ──→ T2 ──→ T3
  T4 ────────────→  [P] (independent of T1-T3)

Phase 2 (Persistence):
  T4 complete, then:
    T5

Phase 3 (Services — T3+T5 complete):
    ┌→ T6 [P] → T8 ──┐
    ┤                  ├──→ Phase 4
    └→ T7 [P] ────────┘

  T6 and T7 run in parallel (unit tests, no DB, parallel-safe).
  T8 runs after T6 completes (depends on RecommendationComputationService).
  Phase 4 starts when both T7 and T8 are complete.

Phase 4 (Integration — T7+T8 complete, then sequential):
    T9 ──→ T10
```

**Parallelism constraints:**

- T6, T7 marked `[P]`: unit tests only, all mocked deps, no DB — parallel-safe per TESTING.md
- T8 NOT parallel: depends on T6 (`PersonalizedRecommendationService` calls `RecommendationComputationService.computeForUser()` on cache miss)
- T4 marked `[P]`: scaffold only, no tests, no shared state — parallel-safe
- T9, T10 are sequential: T10 e2e tests use shared DB (`fakeflix_test`), must not run in parallel with other package e2e tests

---

## Requirement → Task Traceability

| Requirement | Primary Task | Verified In |
| --- | --- | --- |
| REC-01 | T8, T9 | T10 (e2e) |
| REC-02 | T6 | T6 (unit), T10 (e2e) |
| REC-03 | T8 | T8 (unit), T10 (e2e) |
| REC-04 | T6 | T6 (unit), T10 (e2e) |
| REC-05 | T10 | T10 (e2e) |
| REC-06 | T8, T9 | T8 (unit), T10 (e2e) |
| REC-07 | T6 | T6 (unit), T10 (e2e) |
| REC-08 | T7, T8 | T7 (unit), T8 (unit), T10 (e2e) |
| REC-09 | T6 | T6 (unit) |
| CW-01 | T7 | T7 (unit), T10 (e2e) |
| CW-02 | T7 | T7 (unit), T10 (e2e) |
| CW-03 | T7 | T7 (unit), T10 (e2e) |
| CW-04 | T7 | T7 (unit), T10 (e2e) |
| CW-05 | T5, T7 | T7 (unit), T10 (e2e) |
| CW-06 | T7 | T7 (unit), T10 (e2e) |
| CW-07 | T7 | T7 (unit) |

**Coverage:** 16 requirements, 16 mapped to tasks, 0 unmapped
