# Content Lifecycle Core Tasks

**Design:** `.specs/features/content-lifecycle-core/design.md`
**Status:** Draft

---

## Execution Plan

### Phase 1: Data Model Foundation (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Domain Logic (Parallel OK)

```
     ┌→ T4 ─┐
T3 ──┤      ├──→ T6
     └→ T5 ─┘
```

### Phase 3: Orchestration & HTTP (Sequential)

```
T6 → T7 → T8
```

### Phase 4: Catalog Integration (Sequential)

```
T8 → T9 → T10
```

### Phase 5: Admin Listing & Migration (Parallel OK)

```
      ┌→ T11 ─┐
T10 ──┤       ├──→ T13
      └→ T12 ─┘
```

### Phase 6: Gate (Sequential)

```
T13
```

---

## Task Breakdown

### T1: Create PublishingStatus Enum

**What:** Create the `PublishingStatus` enum with four states (DRAFT, REVIEW, PUBLISHED, ARCHIVED) and export it from content/shared.
**Where:** `package/content/shared/core/enum/publishing-status.enum.ts`
**Depends on:** None
**Reuses:** `ContentType` enum pattern from `package/content/shared/core/enum/content-type.enum.ts`
**Requirement:** LIFECYCLE-01

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] Enum file created with DRAFT, REVIEW, PUBLISHED, ARCHIVED values
- [ ] Exported from `package/content/shared/core/index.ts` barrel
- [ ] No TypeScript errors

**Tests:** none
**Gate:** quick — `nx lint:check content`

---

### T2: Add publishingStatus Column to Content Entity + Create ContentTransition Entity

**What:** Add `publishingStatus` column (enum, default DRAFT) to the abstract `Content` entity. Create `ContentTransition` entity for audit trail. Both in content/shared persistence.
**Where:** `package/content/shared/persistence/entity/content.entity.ts`, `package/content/shared/persistence/entity/content-transition.entity.ts`
**Depends on:** T1
**Reuses:** `DefaultEntity` base class, `Content` entity pattern
**Requirement:** LIFECYCLE-01, LIFECYCLE-05, LIFECYCLE-06

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] `Content` entity has `publishingStatus` column with `type: 'enum'`, `enum: PublishingStatus`, `default: PublishingStatus.DRAFT`
- [ ] `ContentTransition` entity created with fields: `contentId` (uuid), `previousState` (enum), `newState` (enum), `triggeredBy` (varchar), `reason` (varchar, nullable), `transitionedAt` (timestamptz, default CURRENT_TIMESTAMP)
- [ ] `ContentTransition` registered in `ContentSharedPersistenceModule` entities array
- [ ] No TypeScript errors

**Tests:** none
**Gate:** quick — `nx lint:check content`

---

### T3: Generate and Run Database Migration

**What:** Generate TypeORM migration for the new `publishingStatus` column and `ContentTransition` table. The migration must set all existing rows to `PUBLISHED`.
**Where:** `package/content/shared/persistence/migration/` (auto-generated)
**Depends on:** T2
**Reuses:** Nx migration commands from `project.json`

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] Migration generated via `nx db:generate content`
- [ ] Migration SQL adds `publishingStatus` column with DEFAULT 'DRAFT'
- [ ] Migration SQL creates `ContentTransition` table
- [ ] Migration includes `UPDATE "ContentItem" SET "publishingStatus" = 'PUBLISHED' WHERE "publishingStatus" = 'DRAFT'` to migrate existing data
- [ ] Migration runs successfully via `nx db:migrate content`
- [ ] No TypeScript errors

**Tests:** none
**Gate:** quick — `nx db:migrate content` runs without errors

---

### T4: Create ContentPublishingStateMachineService [P]

**What:** Create the state machine service that validates and executes publishing state transitions using the `Map<Status, AllowedStatuses[]>` pattern from billing.
**Where:** `package/content/management/core/service/content-publishing-state-machine.service.ts`
**Depends on:** T3
**Reuses:** `SubscriptionStateMachineService` pattern from `package/billing/core/service/subscription-state-machine.service.ts`
**Requirement:** LIFECYCLE-02, LIFECYCLE-04

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] Service created with `ALLOWED_TRANSITIONS` map: DRAFT→[REVIEW], REVIEW→[PUBLISHED, DRAFT], PUBLISHED→[ARCHIVED], ARCHIVED→[PUBLISHED]
- [ ] `transition(content, targetState)` method validates and mutates `content.publishingStatus`
- [ ] `getAllowedTransitions(currentState)` returns valid target states
- [ ] Throws `UnprocessableEntityException` on invalid transitions with descriptive message listing allowed transitions
- [ ] Unit test created at `package/content/management/core/service/__test__/unit/content-publishing-state-machine.service.spec.ts`
- [ ] Unit test covers: all valid transitions succeed, all invalid transitions throw 422, `getAllowedTransitions` returns correct values
- [ ] Gate check passes: `nx test:unit content`

**Tests:** unit
**Gate:** quick — `nx test:unit content`

---

### T5: Create PublicationQualityGateService [P]

**What:** Create the quality gate service that validates content meets minimum quality criteria before publication (thumbnail, description, genre, age rating, episodes for TV shows).
**Where:** `package/content/management/core/service/publication-quality-gate.service.ts`
**Depends on:** T3
**Reuses:** None (new domain logic)
**Requirement:** LIFECYCLE-03, LIFECYCLE-07, LIFECYCLE-08, LIFECYCLE-09, LIFECYCLE-10

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] Service created with `validate(content: Content): QualityGateResult` method
- [ ] Checks: (a) thumbnail exists, (b) description ≥50 chars, (c) at least one genre, (d) ageRecommendation not null
- [ ] For TV_SHOW type: additionally checks at least 1 episode exists
- [ ] Returns `{ passed: boolean, failures: Array<{ field, rule, message }> }`
- [ ] Unit test created at `package/content/management/core/service/__test__/unit/publication-quality-gate.service.spec.ts`
- [ ] Unit test covers: all gates pass, each individual gate failure, multiple failures combined, TV_SHOW episode check, MOVIE skips episode check
- [ ] Gate check passes: `nx test:unit content`

**Tests:** unit
**Gate:** quick — `nx test:unit content`

---

### T6: Create ContentTransitionRepository

**What:** Create the repository for persisting ContentTransition audit records.
**Where:** `package/content/management/persistence/repository/content-transition.repository.ts`
**Depends on:** T4, T5
**Reuses:** `DefaultTypeOrmRepository` pattern, `@InjectDataSource('content')`
**Requirement:** LIFECYCLE-05

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] Repository extends `DefaultTypeOrmRepository<ContentTransition>`
- [ ] Uses `@InjectDataSource('content')`
- [ ] Registered in `ContentManagementModule` providers
- [ ] No TypeScript errors

**Tests:** none (tested via e2e)
**Gate:** quick — `nx lint:check content`

---

### T7: Create TransitionContentUseCase

**What:** Create the orchestrating use case that coordinates state transition: load content → validate transition → check gates (if publishing) → save content → log audit record.
**Where:** `package/content/management/core/use-case/transition-content.use-case.ts`
**Depends on:** T6
**Reuses:** `@Transactional({ connectionName: 'content' })` pattern, `ContentRepository`
**Requirement:** LIFECYCLE-02, LIFECYCLE-03, LIFECYCLE-05

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] Use case created with `execute(contentId, targetState, triggeredBy, reason?)` method
- [ ] Loads content with relations (thumbnail, episodes for TV shows)
- [ ] Calls `ContentPublishingStateMachineService.transition()` for validation
- [ ] Calls `PublicationQualityGateService.validate()` when transitioning to PUBLISHED
- [ ] Throws `UnprocessableEntityException` with gate failures when gates fail
- [ ] Saves updated content via `ContentRepository`
- [ ] Creates and saves `ContentTransition` audit record
- [ ] Throws `NotFoundException` when content not found
- [ ] Uses `@Transactional({ connectionName: 'content' })`
- [ ] Registered in `ContentManagementModule` providers
- [ ] No TypeScript errors

**Tests:** none (tested via e2e in T8)
**Gate:** quick — `nx lint:check content`

---

### T8: Create ContentLifecycleController + Transition DTOs + E2E Tests

**What:** Create the REST controller with `PATCH /admin/content/:id/transition` endpoint, request/response DTOs, and comprehensive e2e tests for the full state transition flow.
**Where:** `package/content/management/http/rest/controller/content-lifecycle.controller.ts`, `package/content/management/http/rest/dto/request/transition-content.dto.ts`, `package/content/management/__test__/e2e/lifecycle/content-lifecycle-transition.spec.ts`
**Depends on:** T7
**Reuses:** Lean controller pattern, `AdminGuard`, `ValidationPipe`, e2e test pattern from `management-movie.spec.ts`
**Requirement:** LIFECYCLE-02, LIFECYCLE-03, LIFECYCLE-04, LIFECYCLE-05, LIFECYCLE-06, LIFECYCLE-07, LIFECYCLE-08, LIFECYCLE-09, LIFECYCLE-10

**Tools:**
- MCP: NONE
- Skill: create-e2e-tests

**Done when:**
- [ ] Controller created with `PATCH /admin/content/:id/transition` endpoint
- [ ] Uses `@UseGuards(AdminGuard)` (or project's auth guard pattern)
- [ ] `TransitionContentDto` validates `targetState` as enum and optional `reason` as string
- [ ] Controller extracts userId from `ClsService` (or request context) for `triggeredBy`
- [ ] Registered in `ContentManagementModule` controllers
- [ ] E2E test file created covering:
  - Create content → verify initial DRAFT state
  - DRAFT → REVIEW transition succeeds
  - REVIEW → PUBLISHED with all gates passing succeeds
  - REVIEW → PUBLISHED with missing thumbnail returns 422 with gate failures
  - REVIEW → PUBLISHED with short description returns 422
  - REVIEW → PUBLISHED with no genres returns 422
  - REVIEW → PUBLISHED with null ageRecommendation returns 422
  - TV_SHOW REVIEW → PUBLISHED with no episodes returns 422
  - Invalid transition (DRAFT → PUBLISHED) returns 422 with allowed transitions
  - Non-existent content ID returns 404
  - REVIEW → DRAFT transition succeeds
  - PUBLISHED → ARCHIVED succeeds
  - ARCHIVED → PUBLISHED re-runs quality gates
- [ ] Gate check passes: `nx test:e2e content`

**Tests:** e2e
**Gate:** full — `nx test:unit content && nx test:e2e content`

---

### T9: Modify CatalogContentRepository to Filter by PUBLISHED

**What:** Update `CatalogContentRepository.findAll()` to only return content with `publishingStatus = PUBLISHED`. This makes catalog filtering transparent to all consumers.
**Where:** `package/content/catalog/persistence/repository/catalog-content.repository.ts`
**Depends on:** T8
**Reuses:** Existing repository, `PublishingStatus` enum
**Requirement:** LIFECYCLE-11, LIFECYCLE-13

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] `findAll()` method adds `where: { publishingStatus: PublishingStatus.PUBLISHED }` to the query
- [ ] `PublishingStatus` import added to repository
- [ ] No TypeScript errors

**Tests:** none (tested via e2e in T10)
**Gate:** quick — `nx lint:check content`

---

### T10: E2E Tests for Catalog Filtering by Publishing Status

**What:** Create e2e tests verifying that the public catalog (GraphQL and facade) only returns PUBLISHED content.
**Where:** `package/content/catalog/__test__/e2e/catalog/catalog-publishing-filter.spec.ts`
**Depends on:** T9
**Reuses:** Existing catalog e2e pattern from `list-content.spec.ts`
**Requirement:** LIFECYCLE-11, LIFECYCLE-13

**Tools:**
- MCP: NONE
- Skill: create-e2e-tests

**Done when:**
- [ ] E2E test file created covering:
  - Insert content in DRAFT state → query catalog → verify not returned
  - Insert content in REVIEW state → query catalog → verify not returned
  - Insert content in PUBLISHED state → query catalog → verify returned
  - Insert content in ARCHIVED state → query catalog → verify not returned
  - Insert mix of states → verify only PUBLISHED returned
  - Verify ContentCatalogFacade.findAllWithGenres() also filters correctly
- [ ] Gate check passes: `nx test:e2e content`

**Tests:** e2e
**Gate:** full — `nx test:unit content && nx test:e2e content`

---

### T11: Create Admin Content Listing Endpoint + E2E Tests [P]

**What:** Add `GET /admin/content` (all states, optional filter) and `GET /admin/content/:id` (single item with publishingStatus) to the lifecycle controller.
**Where:** `package/content/management/http/rest/controller/content-lifecycle.controller.ts` (modify), `package/content/management/core/use-case/list-admin-content.use-case.ts`, `package/content/management/core/use-case/get-admin-content.use-case.ts`, `package/content/management/__test__/e2e/lifecycle/admin-content-listing.spec.ts`
**Depends on:** T10
**Reuses:** `ContentRepository`, lean controller pattern
**Requirement:** LIFECYCLE-06, LIFECYCLE-12

**Tools:**
- MCP: NONE
- Skill: create-e2e-tests

**Done when:**
- [ ] `ListAdminContentUseCase` created with optional status filter
- [ ] `GetAdminContentUseCase` created returning single content with publishingStatus
- [ ] `GET /admin/content` endpoint added with `?status=DRAFT,REVIEW` optional query param
- [ ] `GET /admin/content/:id` endpoint added returning content with publishingStatus field
- [ ] `ContentRepository` extended with `findAllWithOptionalStatusFilter()` and `findByIdWithRelations()` methods
- [ ] Both use cases registered in `ContentManagementModule`
- [ ] E2E tests covering:
  - GET /admin/content returns all states
  - GET /admin/content?status=DRAFT returns only drafts
  - GET /admin/content?status=DRAFT,REVIEW returns both
  - GET /admin/content/:id returns content with publishingStatus field
  - GET /admin/content/:id with non-existent ID returns 404
- [ ] Gate check passes: `nx test:e2e content`

**Tests:** e2e
**Gate:** full — `nx test:unit content && nx test:e2e content`

---

### T12: Update Existing Content Creation to Default to DRAFT [P]

**What:** Ensure that `MovieContent.create()` and `TvShowContent.create()` factory methods set `publishingStatus = DRAFT`. Update existing e2e tests that may break due to catalog filtering.
**Where:** `package/content/shared/persistence/entity/content.entity.ts` (verify default), `package/content/management/__test__/e2e/management/management-movie.spec.ts`, `package/content/management/__test__/e2e/management/management-tv-show.spec.ts`
**Depends on:** T10
**Reuses:** Existing entity factory methods, existing e2e tests
**Requirement:** LIFECYCLE-01

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] Verified that `Content` entity `default: PublishingStatus.DRAFT` applies to factory methods
- [ ] Existing management e2e tests updated if they depend on created content being in catalog
- [ ] Existing catalog e2e tests (`list-content.spec.ts`) updated to insert content with `publishingStatus = PUBLISHED` for catalog queries
- [ ] All existing e2e tests pass: `nx test:e2e content`

**Tests:** e2e (updating existing tests)
**Gate:** full — `nx test:unit content && nx test:e2e content`

---

### T13: Full Build Gate Check

**What:** Run complete build, lint, and test suite to verify the entire M1 feature is integrated correctly.
**Where:** N/A (verification only)
**Depends on:** T11, T12

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] `nx build monolith` passes
- [ ] `nx lint:check content` passes
- [ ] `nx test:unit content` passes
- [ ] `nx test:e2e content` passes
- [ ] `nx test:e2e recommendations` passes (cross-module — verifies facade still works)

**Tests:** none (meta-task)
**Gate:** build — `nx build monolith && nx lint:check content && nx test:unit content && nx test:e2e content && nx test:e2e recommendations`

---

## Parallel Execution Map

```
Phase 1 (Sequential - Foundation):
  T1 ──→ T2 ──→ T3

Phase 2 (Parallel - Domain Logic):
  T3 complete, then:
    ├── T4 [P] (state machine service + unit tests)
    └── T5 [P] (quality gate service + unit tests)

Phase 3 (Sequential - Orchestration & HTTP):
  T4, T5 complete, then:
    T6 ──→ T7 ──→ T8 (controller + e2e tests)

Phase 4 (Sequential - Catalog):
  T8 complete, then:
    T9 ──→ T10

Phase 5 (Parallel - Admin + Migration):
  T10 complete, then:
    ├── T11 [P] (admin listing + e2e)
    └── T12 [P] (existing test updates)

Phase 6 (Sequential - Gate):
  T11, T12 complete, then:
    T13 (full build gate)
```

**Parallelism constraint:** T4 and T5 are parallel-safe (unit tests, all deps mocked). T11 and T12 are NOT truly parallel-safe (both touch e2e with shared DB), but they operate on different test files — acceptable if run in separate Jest runs or sequentially within e2e.

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: Create PublishingStatus enum | 1 file + barrel export | ✅ Granular |
| T2: Add column + create entity | 2 entities in same module | ⚠️ OK — cohesive (both are data model changes) |
| T3: Generate and run migration | 1 migration | ✅ Granular |
| T4: State machine service + tests | 1 service + 1 test file | ✅ Granular |
| T5: Quality gate service + tests | 1 service + 1 test file | ✅ Granular |
| T6: Transition repository | 1 repository | ✅ Granular |
| T7: Transition use case | 1 use case | ✅ Granular |
| T8: Controller + DTOs + e2e tests | 1 controller + 1 DTO + 1 test | ⚠️ OK — controller can't be tested without DTO |
| T9: Modify catalog repository | 1 method change | ✅ Granular |
| T10: Catalog filter e2e tests | 1 test file | ✅ Granular |
| T11: Admin listing endpoints + e2e | 2 use cases + 2 endpoints + 1 test | ⚠️ OK — all part of admin listing |
| T12: Update existing tests | Modify existing test files | ✅ Granular |
| T13: Build gate | Verification only | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | Start of Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T3 | T3 → T5 | ✅ Match |
| T6 | T4, T5 | T4,T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T10 | T10 → T12 | ✅ Match |
| T13 | T11, T12 | T11,T12 → T13 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1: Enum | Enum | none | none | ✅ OK |
| T2: Entity | Entity | none | none | ✅ OK |
| T3: Migration | Migration | none | none | ✅ OK |
| T4: Domain service | Domain service | unit | unit | ✅ OK |
| T5: Domain service | Domain service | unit | unit | ✅ OK |
| T6: Repository | Repository | none (via e2e) | none | ✅ OK |
| T7: Use case (write) | Use case | e2e | none (tested in T8) | ⚠️ Merged forward — T8 includes e2e for T7 |
| T8: Controller + DTO | Controller | e2e | e2e | ✅ OK |
| T9: Repository change | Repository | none (via e2e) | none | ✅ OK |
| T10: E2E tests only | Test file | — | e2e | ✅ OK |
| T11: Use case + Controller | Controller + Use case | e2e | e2e | ✅ OK |
| T12: Test updates | Test file | — | e2e | ✅ OK |
| T13: Build gate | Verification | — | none | ✅ OK |

**Note:** T7 (use case) cannot be independently e2e tested without a controller. Its tests are merged forward into T8, which includes the full e2e test suite covering the use case through the controller. This is the "merge forward" resolution from the tasks reference.
