# Content Publishing — Reject Path Tasks

**Spec**: `.specs/features/content-publishing-reject/spec.md`
**Status**: Draft (awaiting approval before Execute)
**Sizing**: Medium — 10 atomic tasks, 3 phases

---

## Gate Check Commands (project-specific)

| Gate | Command | When |
| --- | --- | --- |
| `quick` | `nx lint:check content && nx test:unit content` | After enum/service edits with co-located unit tests |
| `full` | `nx lint:check content && nx test:unit content && nx test:e2e content` | After use-case / controller / pipeline edits with co-located e2e |
| `migrate` | `nx db:migrate content` | After generating migrations |
| `build` | `nx build content` | Before final commit of feature, ensures no webpack/typecheck regressions |

Tests follow the project convention discovered in the codebase:

- **State-machine + quality-gate-style services** → unit tests (`management/core/service/__test__/unit`).
- **Management use cases + controllers** → e2e tests via `createNestApp` + `ContentManagementModule` + `knex` for DB seeding (`management/__test__/e2e/lifecycle`).
- **Pipeline summary + admin listing** → covered by existing e2e (`pipeline-dashboard.spec.ts`, `admin-content-listing.spec.ts`); we extend.

Parallelism: e2e tests share the `content` Postgres DB and ContentTransition table, so e2e-touching tasks are **NOT** parallel-safe with each other. Unit-test tasks ARE parallel-safe.

---

## Execution Plan

### Phase 1 — Foundation (Sequential, schema first)

```
T1 (enum) ──→ T2 (state machine + unit) ──→ T3 (migration generated + applied)
```

`T1` is a prerequisite for everything because the enum value must exist before TypeScript or runtime can use it. `T3` runs after `T2` because we want the new transition rules in place before introducing the new enum into the DB type.

### Phase 2 — Core Reject Use Case (Sequential)

```
T3 ──→ T4 (transition use case branch + e2e) ──→ T5 (recovery e2e)
```

`T4` and `T5` both add to the same e2e file (`reject-path.spec.ts`) → must run sequentially.

### Phase 3 — Dashboard + Listing + Audit Surfaces (Parallel-safe in code, sequential in tests)

```
            ┌→ T6 (pipeline-summary code) ┐
T5 ─────────┤                              ├──→ T9 (extend pipeline e2e)
            └→ T7 (audit-trail e2e ext.)  ┘
                                              T8 (extend admin-listing e2e)
                                              T10 (build + final gate)
```

Code-only edits (`T6`) are independent from e2e extensions (`T7`, `T8`, `T9`). The e2e extensions all touch the shared content DB so they run sequentially. `T10` is the final gate.

---

## Task Breakdown

### T1: Add `REJECTED` to `PublishingStatus` enum

**What**: Append `REJECTED = 'REJECTED'` value to the enum.
**Where**: `package/content/shared/core/enum/publishing-status.enum.ts`
**Depends on**: None
**Reuses**: existing enum file
**Requirement**: PREJ-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Enum has 5 values in declaration order: `DRAFT, REVIEW, PUBLISHED, ARCHIVED, REJECTED`
- [ ] No other file changes (this is enum-only — wiring happens in T2/T4/T6)
- [ ] Gate check passes: `nx lint:check content && nx test:unit content` (existing tests should still pass; new behavior is added in T2)
- [ ] Test count: existing unit tests still pass — no silent deletions

**Tests**: none (enum-only addition; behavior tested by consumers in T2/T4)
**Gate**: quick

**Verify**:
```
yarn ts-node -e "import {PublishingStatus} from './package/content/shared/core/enum/publishing-status.enum'; console.log(Object.values(PublishingStatus));"
# Expected: [ 'DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED', 'REJECTED' ]
```

**Commit**: `feat(content): add REJECTED publishing status enum value`

---

### T2: Extend state machine — `REVIEW → REJECTED` and `REJECTED → DRAFT` (with unit tests)

**What**: Update the `ALLOWED_TRANSITIONS` map and update the `getAllowedTransitions` test cases. Co-located unit tests for both new transitions plus invalid-source-state cases.
**Where**:
- `package/content/management/core/service/content-publishing-state-machine.service.ts`
- `package/content/management/core/service/__test__/unit/content-publishing-state-machine.service.spec.ts`

**Depends on**: T1
**Reuses**: existing `ContentPublishingStateMachineService` patterns and the `it.each(invalidCases)` table-driven style already in the spec
**Requirement**: PREJ-02, PREJ-10

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ALLOWED_TRANSITIONS` map: `REVIEW` value contains `REJECTED`; new entry `REJECTED → [DRAFT]`
- [ ] Unit test added: `transitions from REVIEW to REJECTED`
- [ ] Unit test added: `transitions from REJECTED to DRAFT`
- [ ] Unit test added: `getAllowedTransitions returns [PUBLISHED, DRAFT, REJECTED] for REVIEW`
- [ ] Unit test added: `getAllowedTransitions returns [DRAFT] for REJECTED`
- [ ] Invalid-cases table updated: REJECTED → REVIEW, REJECTED → PUBLISHED, REJECTED → ARCHIVED, DRAFT → REJECTED, PUBLISHED → REJECTED, ARCHIVED → REJECTED all throw
- [ ] Gate check passes: `nx lint:check content && nx test:unit content`
- [ ] Test count: previous count + 4 new `it` cases + 6 new `it.each` rows (× 2 because there are two `.each` blocks). Confirm count delta with `nx test:unit content -- --listTests` before/after.

**Tests**: unit
**Gate**: quick

**Verify**:
```
nx test:unit content -- --testPathPattern=content-publishing-state-machine
# All cases including new transitions should pass
```

**Commit**: `feat(content): allow REVIEW→REJECTED and REJECTED→DRAFT transitions`

---

### T3: Generate + apply migration adding `REJECTED` to the DB enum type

**What**: Generate a TypeORM migration via `nx db:generate content` after T1 lands, review the generated SQL for the enum-add path, and apply it via `nx db:migrate content`.
**Where**: `package/content/shared/persistence/migration/<ts>-<auto-name>.ts` (path generated)
**Depends on**: T1, T2
**Reuses**: existing migration scaffolding (5 migrations already in this folder follow the same generated style)
**Requirement**: PREJ-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Notes**:
- Workspace rule: **never** hand-author migrations. If the generated file does not include `ALTER TYPE … ADD VALUE 'REJECTED'`, stop and investigate the data-source config — do NOT edit the file by hand.
- Postgres caveat: in older PG versions, `ALTER TYPE … ADD VALUE` cannot run inside a transaction. If the generated migration wraps in a transaction and migrate fails, the standard fix is to mark `transaction: false` on the migration class — verify this is what the generator emits before assuming a problem.

**Done when**:
- [ ] Generated migration file exists with timestamp suffix
- [ ] File diff shows ONLY the enum addition (no entity-shape drift; if other changes appear, that's an unrelated drift bug to flag)
- [ ] `nx db:migrate content` runs cleanly against a freshly migrated DB
- [ ] `nx db:migrate content` is idempotent: running twice does not error
- [ ] Down/revert direction in the migration is documented (even if not used in CI)
- [ ] Gate check passes: `nx lint:check content && nx db:migrate content`

**Tests**: none (migration is the test; behavior covered by T4 e2e)
**Gate**: migrate (project-specific, see Gate Check Commands)

**Verify**:
```
nx db:migrate content
psql $CONTENT_DATABASE_URL -c "SELECT unnest(enum_range(NULL::publishing_status_enum));"
# Expected output includes REJECTED
```

**Commit**: `feat(content): generate migration adding REJECTED enum value`

---

### T4: Add `REJECTED` branch to `TransitionContentUseCase` (reason validation + queue cancel)

**What**: Extend `TransitionContentUseCase.execute` with a `targetState === REJECTED` branch that (a) validates `reason` is non-empty after trim, (b) cancels any pending scheduled-publish job and clears `scheduledPublishAt` if set. Co-located e2e in a new `reject-path.spec.ts`.
**Where**:
- `package/content/management/core/use-case/transition-content.use-case.ts` (modify)
- `package/content/management/__test__/e2e/lifecycle/reject-path.spec.ts` (new)

**Depends on**: T3
**Reuses**:
- Existing `ScheduledPublishProducer.cancelSchedule(contentId)` (already used by `cancel-scheduled-publish.use-case.ts`)
- E2e bootstrap pattern from `content-lifecycle-transition.spec.ts` (createNestApp, knex seeding helpers, `cleanUpContentDatabase`, fakeUserId jwt mock)
- `insertMovie` / `insertTvShow` helpers — copy from `content-lifecycle-transition.spec.ts` or extract to a shared helper if user prefers (note: extraction is **not** required for v1; copy is fine to keep tasks atomic)

**Requirement**: PREJ-03, PREJ-04, PREJ-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Use case rejects empty/whitespace `reason` with `UnprocessableEntityException('reason is required when targetState is REJECTED')`
- [ ] Use case rejects an attempt to reject from non-REVIEW source with the standard state-machine error (assertion is that the existing `stateMachineService.transition` runs first)
- [ ] Use case calls `scheduledPublishProducer.cancelSchedule(contentId)` only when `content.scheduledPublishAt` is set; clears the field afterwards
- [ ] On reject, `ContentTransition` row is persisted with `previousState=REVIEW, newState=REJECTED, reason=<input>, triggeredBy=<userId>`
- [ ] E2e covers: (a) happy path REVIEW→REJECTED with reason persists transition + sets status; (b) missing reason returns 422; (c) whitespace-only reason returns 422; (d) reject from DRAFT returns 422 with the state-machine error message; (e) reject of a content with `scheduledPublishAt` clears the field AND removes the BullMQ job (assert via the queue or via the `cancelSchedule` mock if the queue is mocked in test setup)
- [ ] Gate check passes: `nx lint:check content && nx test:unit content && nx test:e2e content`
- [ ] Test count: previous e2e count + 5 new `it` cases in `reject-path.spec.ts`

**Tests**: e2e
**Gate**: full

**Verify**:
```
nx test:e2e content -- --testPathPattern=reject-path
# All 5 cases pass
```

**Commit**: `feat(content): support REJECTED transition with reason validation and schedule cleanup`

---

### T5: E2e for the `REJECTED → DRAFT` recovery path

**What**: Extend the same `reject-path.spec.ts` with the recovery flow: insert a content already in `REJECTED`, transition to `DRAFT`, assert state + audit trail row.
**Where**: `package/content/management/__test__/e2e/lifecycle/reject-path.spec.ts` (modify)
**Depends on**: T4
**Reuses**: helpers introduced in T4 (`insertMovie`, transition request helper)
**Requirement**: PREJ-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] E2e covers: (a) REJECTED→DRAFT happy path persists transition row and resets state to DRAFT; (b) REJECTED→REVIEW returns 422 (illegal); (c) REJECTED→PUBLISHED returns 422 (illegal); (d) REJECTED→ARCHIVED returns 422 (illegal)
- [ ] Gate check passes: `nx lint:check content && nx test:unit content && nx test:e2e content`
- [ ] Test count: previous + 4 new `it` cases

**Tests**: e2e
**Gate**: full

**Verify**:
```
nx test:e2e content -- --testPathPattern=reject-path
# All 9 cases (5 from T4 + 4 from T5) pass
```

**Commit**: `feat(content): support REJECTED→DRAFT recovery flow`

---

### T6: Extend `PipelineSummaryUseCase` with `rejected` count [P]

**What**: Add `rejected: number` to `PipelineStatusCounts`, update `buildEmptyCounts`, and add `[PublishingStatus.REJECTED]: 'rejected'` to the `statusKey` map. The repository raw queries (`countByPublishingStatus`, `countByPublishingStatusAndContentType`) need no change — they already group by status dynamically.
**Where**: `package/content/management/core/use-case/pipeline-summary.use-case.ts` (modify)
**Depends on**: T5 (so all DB schema + state-machine work has landed)
**Reuses**: existing summary structure
**Requirement**: PREJ-08

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `PipelineStatusCounts` interface has `rejected: number`
- [ ] `buildEmptyCounts()` returns the field initialized to 0
- [ ] `statusKey` map handles `REJECTED`
- [ ] No other code change in this file
- [ ] Gate check passes: `nx lint:check content && nx test:unit content` (e2e validation arrives in T9)
- [ ] Test count: unchanged (no test changes in this task)

**Tests**: none in this task — required e2e validation is co-located with T9 (the existing `pipeline-dashboard.spec.ts` is the natural home, and it's edited there to keep tests close to the assertions)
**Gate**: quick

**Justification for `Tests: none`**: The TESTING.md coverage rule says e2e is required for use-case changes. We satisfy that in T9 by **merging forward** — the rejected-count assertions land in the same task that extends the existing dashboard e2e file, keeping the test atomic with its scenario rather than duplicating bootstrap. T6 is intentionally limited to the type-level + map change so T9 can assert against it directly.

**Verify**:
```
nx lint:check content && nx test:unit content
# Lints clean, type signature change compiles
```

**Commit**: `feat(content): track REJECTED count in pipeline summary`

---

### T7: Extend audit-trail e2e to cover rejection reason persistence

**What**: Add a `it('records the rejection reason in the audit trail', …)` case to `audit-trail.spec.ts` that triggers a REVIEW→REJECTED transition through HTTP and asserts the `ContentTransition` row visible via `GET /admin/content/:id/transitions` includes the supplied `reason`.
**Where**: `package/content/management/__test__/e2e/lifecycle/audit-trail.spec.ts` (modify)
**Depends on**: T5
**Reuses**: existing helpers in `audit-trail.spec.ts`
**Requirement**: PREJ-06 (covers the audit-visibility edge case in spec)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] One new `it` case in `audit-trail.spec.ts` asserts the rejection's reason is returned by `GET /admin/content/:id/transitions`
- [ ] Gate check passes: `nx lint:check content && nx test:unit content && nx test:e2e content`
- [ ] Test count: previous + 1

**Tests**: e2e
**Gate**: full

**Verify**:
```
nx test:e2e content -- --testPathPattern=audit-trail
```

**Commit**: `test(content): cover rejection reason in audit trail e2e`

---

### T8: Extend admin-content-listing e2e to cover `?status=REJECTED` filter

**What**: Add a case to `admin-content-listing.spec.ts` that seeds 1 DRAFT, 1 REVIEW, and 2 REJECTED items, calls `GET /admin/content?status=REJECTED`, and asserts only the 2 REJECTED items come back. The existing controller logic accepts comma-separated status values via `Object.values(PublishingStatus).includes(...)`, so no controller change is needed once T1 lands.
**Where**: `package/content/management/__test__/e2e/lifecycle/admin-content-listing.spec.ts` (modify)
**Depends on**: T5
**Reuses**: existing helpers + insert patterns in `admin-content-listing.spec.ts`
**Requirement**: PREJ-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] One new `it` case asserts the filter returns exactly the 2 REJECTED items
- [ ] One additional `it` case asserts mixed filter `?status=DRAFT,REJECTED` returns 3 items (DRAFT + 2 REJECTED)
- [ ] Gate check passes: `nx lint:check content && nx test:unit content && nx test:e2e content`
- [ ] Test count: previous + 2

**Tests**: e2e
**Gate**: full

**Verify**:
```
nx test:e2e content -- --testPathPattern=admin-content-listing
```

**Commit**: `test(content): cover REJECTED filter on admin content listing`

---

### T9: Extend pipeline-dashboard e2e to assert the `rejected` count

**What**: In `pipeline-dashboard.spec.ts`, add cases for the rejected count: (a) empty DB returns `rejected: 0`; (b) inserting 2 rejected movies + 1 rejected TV show yields `rejected: 3` in the totals and `rejected: 2` for MOVIE / `rejected: 1` for TV_SHOW under `?breakdown=contentType`; (c) recent-transitions endpoint surfaces a REVIEW→REJECTED transition entry.
**Where**: `package/content/management/__test__/e2e/lifecycle/pipeline-dashboard.spec.ts` (modify)
**Depends on**: T6, T7, T8 (all dashboard-touching work landed)
**Reuses**: existing seeding helpers in the same file
**Requirement**: PREJ-08, PREJ-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] 3 new `it` cases assert the `rejected` field in summary, breakdown, and recent-transitions response
- [ ] Existing assertions in the file still pass with the new field present (search for tight `toEqual` matchers and update them to include `rejected: 0` if they fail)
- [ ] Gate check passes: `nx lint:check content && nx test:unit content && nx test:e2e content`
- [ ] Test count: previous + 3 (or more if existing assertions had to be loosened/updated)

**Tests**: e2e
**Gate**: full

**Verify**:
```
nx test:e2e content -- --testPathPattern=pipeline-dashboard
```

**Commit**: `feat(content): expose rejected count in pipeline dashboard e2e`

---

### T10: Final gate — full project build + lint + tests

**What**: Run the project-wide gates and confirm zero regressions across the content package and any consumers (monolith app, other packages that import from `@tlc/content`).
**Where**: workspace root (no code changes)
**Depends on**: T9
**Reuses**: existing nx targets
**Requirement**: cross-cutting (Success Criteria gate)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `nx lint:check content` passes
- [ ] `nx test:unit content` passes
- [ ] `nx test:e2e content` passes
- [ ] `nx build content` passes (catches webpack / tsc regressions; per AGENTS.md note: monolith webpack bundle has known TypeORM globbing issues — DO NOT use `nx build monolith` as the gate)
- [ ] `nx affected --target=test:e2e --parallel=false` passes (catches downstream consumers, e.g. monolith e2e if any reference PublishingStatus)
- [ ] Gate check passes: full project gate (the four commands above)
- [ ] Test count: net delta is +N where N = sum of new tests across T2/T4/T5/T7/T8/T9 (≈ 4 unit + 5+4+1+2+3 e2e = 19 tests). No silent deletions.

**Tests**: none (this is the gate task)
**Gate**: build (per project-specific gate table above)

**Verify**:
```
nx lint:check content && nx test:unit content && nx test:e2e content && nx build content
nx affected --target=test:e2e --parallel=false
```

**Commit**: not a separate commit — this is verification only, not a code change.

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3

Phase 2 (Sequential):
  T3 ──→ T4 ──→ T5

Phase 3 (Mostly Sequential — e2e DB contention):
  T5 ──┬──→ T6 ────────────────────┐
       ├──→ T7 ──→ T8 ──→ T9 ──→ T10

  T6 is code-only and parallel-safe with T7/T8 in code, but T9 reads
  from T6 so the T6 → T9 edge is required. T7 and T8 touch the same
  e2e database so they run sequentially even though the code edits
  are unrelated.
```

**Parallelism constraint**: T6 is the only `[P]`-eligible task because it's the only Phase-3 task that does NOT run e2e tests. All other Phase-3 tasks share the content Postgres DB through their e2e spec files and must run sequentially.

**Sub-agent delegation**: For execution, each task can be delegated to one sub-agent. Phase 1 and Phase 2 must run sequentially (dependencies). In Phase 3, T6 can be delegated alongside T7 (T6 is code-only; T7 starts an e2e); T8 and T9 must wait for T7 to release the DB.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Add enum value | 1 enum value | ✅ Granular |
| T2: Extend state machine + tests | 1 service file + 1 spec file (tightly cohesive) | ✅ Granular |
| T3: Generate + apply migration | 1 generated file + 1 command | ✅ Granular |
| T4: Reject branch in use case + e2e | 1 use case + 1 new e2e (one feature surface) | ✅ Granular |
| T5: Recovery e2e | 1 spec file extension | ✅ Granular |
| T6: Pipeline summary use-case shape | 1 use case file | ✅ Granular |
| T7: Audit-trail e2e extension | 1 spec file extension | ✅ Granular |
| T8: Admin-listing e2e extension | 1 spec file extension | ✅ Granular |
| T9: Pipeline dashboard e2e extension | 1 spec file extension | ✅ Granular |
| T10: Final gate | 0 code changes (verification only) | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | (root) | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1, T2 | T2 → T3 (T1 transitive) | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 (Phase 3 fan-out) | ✅ Match |
| T7 | T5 | T5 → T7 (Phase 3 fan-out) | ✅ Match |
| T8 | T5 | T7 → T8 (sequenced for DB contention) | ✅ Match |
| T9 | T6, T7, T8 | T6 → T9, T8 → T9 (T7 → T8 transitive) | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |

---

## Test Co-location Validation

Project test convention (derived from existing code, since no `TESTING.md` exists yet):

| Code layer | Required test type |
| --- | --- |
| `shared/core/enum` | none (consumer-tested) |
| `shared/persistence/migration` | none (gate-tested via `nx db:migrate`) |
| `management/core/service` | unit |
| `management/core/use-case` | e2e (project convention — no use-case unit tests in management subdomain) |
| `management/__test__/e2e/lifecycle` | n/a (these ARE the tests) |

| Task | Code Layer Created/Modified | Required | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | enum | none | none | ✅ OK |
| T2 | service + spec | unit | unit (co-located) | ✅ OK |
| T3 | migration | none | none | ✅ OK |
| T4 | use case + new e2e file | e2e | e2e (co-located in new file) | ✅ OK |
| T5 | extends e2e file from T4 | e2e | e2e (co-located) | ✅ OK |
| T6 | use case (type-only edit) | e2e | none — **merged forward into T9** | ✅ OK with justification |
| T7 | e2e extension | e2e | e2e (co-located) | ✅ OK |
| T8 | e2e extension | e2e | e2e (co-located) | ✅ OK |
| T9 | e2e extension | e2e | e2e (co-located) | ✅ OK |
| T10 | none (gate task) | none | none | ✅ OK |

**T6 justification**: T6's behavior is tested in T9 because the e2e harness for the pipeline summary lives in `pipeline-dashboard.spec.ts`. Splitting the assertion into a synthetic test on T6 would duplicate the entire `createNestApp` bootstrap. This is a **merge-forward** per the tasks reference rule, not test deferral — the dependency T6 → T9 is explicit, and T9's "Done when" includes the assertions that prove T6.

---

## Required tools / approvals before execution

Before starting Execute, confirm:

1. **Docker is running**: `yarn docker:up` (Postgres + Redis required for e2e). If running in Cursor Cloud, follow the AGENTS.md instructions for `dockerd`.
2. **Migrations are clean**: `nx db:migrate content` runs from a known baseline before T3.
3. **Branch policy**: each task lands on its own atomic commit. The implied branch is `feature/content-publishing-reject` (please confirm naming).

---

## Commit log preview (one per task that produces code)

```
T1   feat(content): add REJECTED publishing status enum value
T2   feat(content): allow REVIEW→REJECTED and REJECTED→DRAFT transitions
T3   feat(content): generate migration adding REJECTED enum value
T4   feat(content): support REJECTED transition with reason validation and schedule cleanup
T5   feat(content): support REJECTED→DRAFT recovery flow
T6   feat(content): track REJECTED count in pipeline summary
T7   test(content): cover rejection reason in audit trail e2e
T8   test(content): cover REJECTED filter on admin content listing
T9   feat(content): expose rejected count in pipeline dashboard e2e
T10  (no commit — final gate verification)
```
