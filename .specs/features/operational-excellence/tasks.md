# Operational Excellence Tasks

**Design:** `.specs/features/operational-excellence/design.md`
**Status:** Draft

---

## Execution Plan

### Phase 1: Audit Trail (Sequential)

```
T1 → T2
```

### Phase 2: Bulk Transitions (Sequential)

```
T2 → T3 → T4
```

### Phase 3: Gate (Sequential)

```
T4
```

---

## Task Breakdown

### T1: Create ListContentTransitionsUseCase + Extend Repository + Add Endpoint + E2E Tests

**What:** Create the use case for retrieving per-content transition history, add `findByContentId()` to `ContentTransitionRepository`, add `GET /admin/content/:id/transitions` endpoint, extend `TransitionContentDto` to accept optional `reason` field, and create e2e tests.
**Where:** `package/content/management/core/use-case/list-content-transitions.use-case.ts`, `package/content/management/persistence/repository/content-transition.repository.ts` (modify), `package/content/management/http/rest/controller/content-lifecycle.controller.ts` (modify), `package/content/management/__test__/e2e/lifecycle/audit-trail.spec.ts`
**Depends on:** None (M1 + M2 must be complete)
**Reuses:** `ContentTransitionRepository`, `ContentLifecycleController`, existing e2e patterns
**Requirement:** OPEX-01, OPEX-02, OPEX-03, OPEX-04

**Tools:**
- MCP: NONE
- Skill: create-e2e-tests

**Done when:**
- [ ] `ContentTransitionRepository` extended with `findByContentId(contentId, orderBy = 'DESC')` method
- [ ] `ListContentTransitionsUseCase` created with `execute(contentId)` method returning transitions ordered most recent first
- [ ] `GET /admin/content/:id/transitions` endpoint added to `ContentLifecycleController`
- [ ] `TransitionContentDto` extended with optional `reason` field (`@IsOptional()`, `@IsString()`, `@MaxLength(500)`)
- [ ] `TransitionContentUseCase` passes `reason` to `ContentTransition` record when provided
- [ ] Response DTO created for transition history items
- [ ] Use case registered in `ContentManagementModule`
- [ ] E2E tests covering:
  - Create content → transition through DRAFT→REVIEW→PUBLISHED→ARCHIVED → query transitions → verify full history in reverse chronological order
  - Transition with reason (REVIEW → DRAFT with rejection reason) → verify reason in history
  - Automatic transitions (e.g., scheduled publish) show `triggeredBy: 'SYSTEM'`
  - Content with no transitions → returns empty array
  - Non-existent content ID → returns 404
- [ ] Gate check passes: `nx test:e2e content`

**Tests:** e2e
**Gate:** full — `nx test:unit content && nx test:e2e content`

---

### T2: Create BulkTransitionContentUseCase + Request/Response DTOs

**What:** Create the use case that processes bulk transitions with partial success/failure handling. Create request and response DTOs.
**Where:** `package/content/management/core/use-case/bulk-transition-content.use-case.ts`, `package/content/management/http/rest/dto/request/bulk-transition-content.dto.ts`, `package/content/management/http/rest/dto/response/bulk-transition-content.dto.ts`
**Depends on:** T1
**Reuses:** `TransitionContentUseCase` (called per item)
**Requirement:** OPEX-05, OPEX-06, OPEX-07, OPEX-08

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] `BulkTransitionContentUseCase` created with `execute(contentIds, targetState, triggeredBy)` method
- [ ] Iterates through contentIds, calling `TransitionContentUseCase.execute()` per item in try/catch
- [ ] Collects `succeeded: [{id, newState}]` and `failed: [{id, reason}]`
- [ ] `BulkTransitionContentDto` validates `contentIds` as array of UUIDs with `@ArrayMaxSize(50)` and `@ArrayMinSize(1)`, `targetState` as `PublishingStatus` enum
- [ ] Response DTO with `succeeded` and `failed` arrays
- [ ] Use case registered in `ContentManagementModule`
- [ ] No TypeScript errors

**Tests:** none (tested via e2e in T3)
**Gate:** quick — `nx lint:check content`

---

### T3: Add Bulk Transition Endpoint + E2E Tests

**What:** Add `POST /admin/content/bulk-transition` endpoint to controller and create comprehensive e2e tests.
**Where:** `package/content/management/http/rest/controller/content-lifecycle.controller.ts` (modify), `package/content/management/__test__/e2e/lifecycle/bulk-transition.spec.ts`
**Depends on:** T2
**Reuses:** `ContentLifecycleController`, existing e2e patterns
**Requirement:** OPEX-05, OPEX-06, OPEX-07, OPEX-08

**Tools:**
- MCP: NONE
- Skill: create-e2e-tests

**Done when:**
- [ ] `POST /admin/content/bulk-transition` endpoint added to controller
- [ ] Endpoint uses `BulkTransitionContentDto` for validation (50-item limit, non-empty array)
- [ ] Returns `BulkTransitionResponseDto` with succeeded and failed arrays
- [ ] E2E tests covering:
  - Bulk transition of 3 items from DRAFT→REVIEW → all succeed
  - Bulk transition with mix of valid and invalid transitions → partial success/failure
  - Bulk transition to PUBLISHED with some items missing quality gates → partial results
  - Bulk transition exceeding 50 items → returns 400
  - Bulk transition with empty contentIds → returns 400
  - Each individual transition in bulk generates its own audit trail record → verify via GET /admin/content/:id/transitions
  - Duplicate content IDs in batch → first succeeds, second may fail
- [ ] Gate check passes: `nx test:e2e content`

**Tests:** e2e
**Gate:** full — `nx test:unit content && nx test:e2e content`

---

### T4: Full Build Gate for M3

**What:** Run complete build, lint, and test suite to verify M3 is fully integrated.
**Where:** N/A (verification only)
**Depends on:** T3

**Tools:**
- MCP: NONE
- Skill: NONE

**Done when:**
- [ ] `nx build monolith` passes
- [ ] `nx lint:check content` passes
- [ ] `nx test:unit content` passes
- [ ] `nx test:e2e content` passes
- [ ] `nx test:e2e recommendations` passes

**Tests:** none (meta-task)
**Gate:** build — `nx build monolith && nx lint:check content && nx test:unit content && nx test:e2e content && nx test:e2e recommendations`

---

## Parallel Execution Map

```
Phase 1 (Sequential - Audit Trail):
  T1 (transitions endpoint + history use case + e2e)

Phase 2 (Sequential - Bulk):
  T1 ──→ T2 ──→ T3

Phase 3 (Sequential - Gate):
  T3 ──→ T4
```

No parallelism in M3 — tasks are sequential and build on each other. The scope is small enough that parallel execution would not save meaningful time.

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: Audit trail endpoint + use case + repo + e2e | 1 use case + 1 repo method + 1 endpoint + 1 DTO + 1 test | ⚠️ OK — all are part of the same vertical slice |
| T2: Bulk use case + DTOs | 1 use case + 2 DTOs | ✅ Granular |
| T3: Bulk endpoint + e2e | 1 endpoint + 1 test file | ✅ Granular |
| T4: Build gate | Verification only | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None (M1+M2 complete) | Start of Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1: Use case + repo + controller | Use case + repository + controller | e2e | e2e | ✅ OK |
| T2: Use case + DTOs | Use case + DTO | e2e / none | none (T3 has e2e) | ⚠️ Merged forward into T3 |
| T3: Controller + tests | Controller + tests | e2e | e2e | ✅ OK |
| T4: Build gate | Verification | — | none | ✅ OK |
