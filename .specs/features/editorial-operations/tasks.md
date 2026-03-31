# Editorial Operations Tasks

**Design:** `.specs/features/editorial-operations/design.md`
**Status:** Draft

---

## Execution Plan

### Phase 1: Schema Extension (Sequential)

```
T1 → T2
```

### Phase 2: Scheduled Publishing (Sequential)

```
T2 → T3 → T4 → T5
```

### Phase 3: Archiving (Sequential)

```
T5 → T6
```

### Phase 4: Pipeline Dashboard (Parallel OK)

```
     ┌→ T7 ─┐
T6 ──┤      ├──→ T9
     └→ T8 ─┘
```

### Phase 5: Gate (Sequential)

```
T9
```

---

## Task Breakdown

### T1: Add Scheduling and Archiving Columns to Content Entity

**What:** Add `scheduledPublishAt` (timestamptz, nullable), `schedulingOutcome` (varchar, nullable), `archivedAt` (timestamptz, nullable), and `archivedBy` (varchar, nullable) columns to the `Content` entity.
**Where:** `package/content/shared/persistence/entity/content.entity.ts`
**Depends on:** None (M1 must be complete)
**Reuses:** Existing `Content` entity
**Requirement:** EDITORIAL-01, EDITORIAL-06, EDITORIAL-11

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] Four new columns added to `Content` entity with correct types and nullable constraints
- [ ] No TypeScript errors

**Tests:** none
**Gate:** quick — `nx lint:check content`

---

### T2: Generate and Run Migration for M2 Columns + Register Scheduled Publish Queue

**What:** Generate TypeORM migration for the new columns. Register the `CONTENT_SCHEDULED_PUBLISH` queue in `ContentSharedModule`.
**Where:** `package/content/shared/persistence/migration/` (auto-generated), `package/content/shared/queue/queue-constants.ts`, `package/content/shared/content-shared.module.ts`
**Depends on:** T1
**Reuses:** Existing BullMQ registration pattern in `ContentSharedModule`

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] Migration generated via `nx db:generate content`
- [ ] Migration runs successfully via `nx db:migrate content`
- [ ] `CONTENT_SCHEDULED_PUBLISH` queue name added to queue constants
- [ ] Queue registered in `ContentSharedModule` via `BullModule.registerQueue`
- [ ] No TypeScript errors

**Tests:** none
**Gate:** quick — `nx db:migrate content` succeeds

---

### T3: Create ScheduledPublishProducer

**What:** Create the BullMQ producer that enqueues delayed jobs for scheduled publishing and supports cancellation.
**Where:** `package/content/management/queue/producer/scheduled-publish.queue-producer.ts`
**Depends on:** T2
**Reuses:** `VideoProcessingJobProducer` pattern
**Requirement:** EDITORIAL-03, EDITORIAL-05

**Tools:**
- MCP: context7 (BullMQ delayed job API)
- Skill: NONE

**Done when:**
- [ ] Producer created with `schedulePublish(contentId, publishAt)` method using BullMQ `delay` option
- [ ] `cancelSchedule(contentId)` method removes the job by ID
- [ ] Job ID uses content ID for deduplication (`jobId: contentId`)
- [ ] Registered in `ContentManagementModule` providers
- [ ] No TypeScript errors

**Tests:** none (tested via e2e in T5)
**Gate:** quick — `nx lint:check content`

---

### T4: Create ScheduledPublishConsumer + Extend TransitionContentUseCase

**What:** Create the BullMQ consumer that processes scheduled publish jobs. Extend `TransitionContentUseCase` to support scheduling fields: validate `scheduledPublishAt` (≥15 min future) when scheduling, set `schedulingOutcome` on failure, and set `archivedAt`/`archivedBy` on archiving transitions.
**Where:** `package/content/management/queue/consumer/scheduled-publish.queue-consumer.ts`, `package/content/management/core/use-case/transition-content.use-case.ts` (modify)
**Depends on:** T3
**Reuses:** `ContentAgeRecommendationConsumer` pattern, existing `TransitionContentUseCase`
**Requirement:** EDITORIAL-02, EDITORIAL-03, EDITORIAL-06, EDITORIAL-07, EDITORIAL-09, EDITORIAL-11

**Tools:**
- MCP: context7 (BullMQ consumer patterns)
- Skill: NONE

**Done when:**
- [ ] Consumer processes `CONTENT_SCHEDULED_PUBLISH` queue jobs
- [ ] Consumer loads content, checks it's still in REVIEW, calls `TransitionContentUseCase.execute()` with `triggeredBy: 'SYSTEM'`
- [ ] If content is no longer in REVIEW, job is a no-op (log and return)
- [ ] If quality gates fail, sets `content.schedulingOutcome = 'FAILED_VALIDATION'` and saves
- [ ] `TransitionContentUseCase` extended to:
  - Accept optional `scheduledPublishAt` when transitioning to REVIEW
  - Validate `scheduledPublishAt` ≥ 15 minutes in future
  - Call `ScheduledPublishProducer.schedulePublish()` when scheduling
  - Set `archivedAt` and `archivedBy` when transitioning to ARCHIVED
  - Clear `archivedAt`/`archivedBy` when transitioning from ARCHIVED to PUBLISHED
- [ ] Consumer and modified use case registered in `ContentManagementModule`
- [ ] No TypeScript errors

**Tests:** none (tested via e2e in T5)
**Gate:** quick — `nx lint:check content`

---

### T5: E2E Tests for Scheduled Publishing + Archiving + Cancel Schedule

**What:** Create comprehensive e2e tests for scheduled publishing, archiving, schedule cancellation, and the ARCHIVED → PUBLISHED re-gating flow. Add `DELETE /admin/content/:id/schedule` endpoint to controller.
**Where:** `package/content/management/__test__/e2e/lifecycle/scheduled-publishing.spec.ts`, `package/content/management/__test__/e2e/lifecycle/content-archiving.spec.ts`, `package/content/management/http/rest/controller/content-lifecycle.controller.ts` (modify)
**Depends on:** T4
**Reuses:** E2E test pattern from M1's `content-lifecycle-transition.spec.ts`
**Requirement:** EDITORIAL-01, EDITORIAL-02, EDITORIAL-03, EDITORIAL-04, EDITORIAL-05, EDITORIAL-06, EDITORIAL-07, EDITORIAL-08, EDITORIAL-09, EDITORIAL-11

**Tools:**
- MCP: NONE
- Skill: create-e2e-tests

**Done when:**
- [ ] `DELETE /admin/content/:id/schedule` endpoint added to controller (calls `ScheduledPublishProducer.cancelSchedule`)
- [ ] Scheduled publishing e2e tests:
  - Transition to REVIEW with scheduledPublishAt → verify content has scheduled date
  - scheduledPublishAt in the past → returns 422
  - scheduledPublishAt less than 15 min in future → returns 422
  - GET /admin/content?status=REVIEW&scheduled=true → returns only scheduled items
  - Cancel schedule → verify schedule removed, content stays in REVIEW
  - Cancel non-existent schedule → returns 422
- [ ] Archiving e2e tests:
  - PUBLISHED → ARCHIVED → verify removed from public catalog
  - ARCHIVED → PUBLISHED with all gates passing → succeeds, re-gates verified
  - ARCHIVED → PUBLISHED with failing gates → returns 422
  - Archived content shows archivedAt and archivedBy in admin API
  - Archived content preserves all data (metadata, relations intact)
- [ ] Gate check passes: `nx test:e2e content`

**Tests:** e2e
**Gate:** full — `nx test:unit content && nx test:e2e content`

---

### T6: Verify Archiving Exclusion from Recommendations

**What:** Verify that archived content is excluded from recommendation computation by confirming the catalog facade (modified in M1) already filters by PUBLISHED. Add a targeted e2e test if needed.
**Where:** `package/recommendations/__test__/e2e/recommendations/` (verify/add test)
**Depends on:** T5
**Reuses:** Existing recommendations e2e test patterns
**Requirement:** EDITORIAL-10

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] Confirmed `ContentCatalogFacade.findAllWithGenres()` returns only PUBLISHED (from M1 T9)
- [ ] Recommendations e2e test verifies mock `ContentCatalogApi` behavior is consistent
- [ ] If catalog facade already filters correctly, document confirmation (no new test needed)
- [ ] `nx test:e2e recommendations` passes

**Tests:** e2e (verification — may not need new tests)
**Gate:** full — `nx test:e2e recommendations`

---

### T7: Create PipelineSummaryUseCase + Repository Methods [P]

**What:** Create the use case and repository methods for pipeline state aggregation (counts by status, optional breakdown by content type).
**Where:** `package/content/management/core/use-case/pipeline-summary.use-case.ts`, `package/content/management/persistence/repository/content.repository.ts` (modify)
**Depends on:** T6
**Reuses:** `ContentRepository`, TypeORM query builder for aggregation
**Requirement:** EDITORIAL-12, EDITORIAL-13

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] `ContentRepository` extended with `countByPublishingStatus()` method (GROUP BY publishingStatus)
- [ ] `ContentRepository` extended with `countByPublishingStatusAndContentType()` method (GROUP BY both)
- [ ] `PipelineSummaryUseCase` created with `execute(breakdown?)` method
- [ ] Returns `{ draft, review, published, archived }` counts (and optional breakdown)
- [ ] Registered in `ContentManagementModule`
- [ ] No TypeScript errors

**Tests:** none (tested via e2e in T9 — repository methods tested through controller)
**Gate:** quick — `nx lint:check content`

---

### T8: Create ListRecentTransitionsUseCase + PipelineDashboardController [P]

**What:** Create use case for recent transitions and the dashboard controller with all three endpoints.
**Where:** `package/content/management/core/use-case/list-recent-transitions.use-case.ts`, `package/content/management/http/rest/controller/pipeline-dashboard.controller.ts`
**Depends on:** T6
**Reuses:** `ContentTransitionRepository`, lean controller pattern
**Requirement:** EDITORIAL-14

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] `ListRecentTransitionsUseCase` created with `execute(limit = 50)` method
- [ ] `ContentTransitionRepository` extended with `findRecentTransitions(limit)` method (ORDER BY transitionedAt DESC)
- [ ] `PipelineDashboardController` created with:
  - `GET /admin/content/pipeline/summary` → calls `PipelineSummaryUseCase`
  - `GET /admin/content/pipeline/summary?breakdown=contentType` → calls with breakdown param
  - `GET /admin/content/pipeline/recent-transitions` → calls `ListRecentTransitionsUseCase`
- [ ] Response DTOs created for summary and transition list
- [ ] Registered in `ContentManagementModule`
- [ ] No TypeScript errors

**Tests:** none (tested via e2e in T9)
**Gate:** quick — `nx lint:check content`

---

### T9: E2E Tests for Pipeline Dashboard + Full Build Gate

**What:** Create e2e tests for all three dashboard endpoints. Run full build gate.
**Where:** `package/content/management/__test__/e2e/lifecycle/pipeline-dashboard.spec.ts`
**Depends on:** T7, T8
**Reuses:** E2E test patterns from M1
**Requirement:** EDITORIAL-12, EDITORIAL-13, EDITORIAL-14

**Tools:**
- MCP: NONE
- Skill: create-e2e-tests

**Done when:**
- [ ] E2E tests:
  - GET /admin/content/pipeline/summary → returns correct counts per state
  - GET /admin/content/pipeline/summary?breakdown=contentType → returns grouped counts
  - GET /admin/content/pipeline/recent-transitions → returns transitions ordered by time
  - Empty database → all counts are 0, transitions list is empty
- [ ] Full build gate passes:
  - `nx build monolith`
  - `nx lint:check content`
  - `nx test:unit content`
  - `nx test:e2e content`
  - `nx test:e2e recommendations`

**Tests:** e2e
**Gate:** build — `nx build monolith && nx lint:check content && nx test:unit content && nx test:e2e content && nx test:e2e recommendations`

---

## Parallel Execution Map

```
Phase 1 (Sequential - Schema):
  T1 ──→ T2

Phase 2 (Sequential - Scheduled Publishing):
  T2 ──→ T3 ──→ T4 ──→ T5

Phase 3 (Sequential - Archiving Verification):
  T5 ──→ T6

Phase 4 (Parallel - Dashboard):
  T6 complete, then:
    ├── T7 [P] (summary use case + repo)
    └── T8 [P] (transitions use case + controller)

Phase 5 (Sequential - Gate):
  T7, T8 complete, then:
    T9 (e2e tests + full build gate)
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: Add entity columns | 1 entity file | ✅ Granular |
| T2: Migration + queue registration | 1 migration + 1 module config | ⚠️ OK — both are infra setup |
| T3: Scheduled publish producer | 1 producer | ✅ Granular |
| T4: Consumer + use case extension | 1 consumer + 1 use case modification | ⚠️ OK — consumer depends on use case changes |
| T5: E2E tests + cancel endpoint | 2 test files + 1 endpoint | ⚠️ OK — endpoint is minimal, tests validate full flow |
| T6: Recommendations verification | Verification task | ✅ Granular |
| T7: Summary use case + repo | 1 use case + 1 repo method | ✅ Granular |
| T8: Transitions use case + controller | 1 use case + 1 controller | ⚠️ OK — controller needs use case |
| T9: E2E tests + gate | 1 test file + verification | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None (M1 complete) | Start of Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T6 | T6 → T8 | ✅ Match |
| T9 | T7, T8 | T7,T8 → T9 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1: Entity columns | Entity | none | none | ✅ OK |
| T2: Migration + module | Migration + module | none | none | ✅ OK |
| T3: Queue producer | Queue producer | none | none | ✅ OK |
| T4: Consumer + use case | Queue consumer + use case | none / e2e | none (T5 has e2e) | ⚠️ Merged forward into T5 |
| T5: E2E tests + endpoint | Controller (minor) + tests | e2e | e2e | ✅ OK |
| T6: Verification | Verification | — | e2e (existing) | ✅ OK |
| T7: Use case + repo | Use case + repository | e2e / none | none (T9 has e2e) | ⚠️ Merged forward into T9 |
| T8: Use case + controller | Use case + controller | e2e | none (T9 has e2e) | ⚠️ Merged forward into T9 |
| T9: E2E tests + gate | Tests | — | e2e | ✅ OK |
