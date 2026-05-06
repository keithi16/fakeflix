# Content Publishing — Reject Path Specification

**Feature ID prefix**: `PREJ`
**Subdomain(s)**: `package/content/management` (primary), `package/content/shared` (enum + audit-trail entity)
**Sizing**: Medium (~10 tasks, no new architectural patterns)

## Problem Statement

Today the publishing state machine has no way to send content back from `REVIEW` with an explicit reason. A reviewer who finds issues can only push it to `DRAFT` (silently, no reason captured) or block by stalling. This makes it impossible to: (a) tell the author *why* their submission was sent back, (b) distinguish a "withdrew myself" `DRAFT` from a "rejected by reviewer" `DRAFT`, or (c) report on rejection rates in the pipeline dashboard.

## Goals

- [ ] Add a first-class `REJECTED` publishing status with a mandatory reason captured in the audit trail
- [ ] Allow authors to recover from rejection by editing and resubmitting (`REJECTED → DRAFT`)
- [ ] Auto-cancel any pending scheduled-publish job when content is rejected
- [ ] Surface rejection signal in the pipeline dashboard (`rejected` count) and admin content listing
- [ ] Keep rejected content invisible to the public catalog (no end-user impact)

## Out of Scope

| Feature | Reason |
| --- | --- |
| Rejecting from states other than `REVIEW` | Only the review stage produces reject decisions; `DRAFT` rejection is meaningless and `PUBLISHED` rejection conflates with `ARCHIVED` |
| Multi-reviewer voting / approval workflows | Single-reviewer model is the current product surface; multi-reviewer is its own feature |
| Notifications to authors (email/push) | Notification infrastructure lives outside content; out of scope here |
| New `reviewer` role distinct from `admin` | Auth model already has `AdminGuard`; introducing roles is an Identity-package concern |
| Rejection categories / structured reason taxonomy | Free-text reason is sufficient for v1; tagging can come later |
| GraphQL exposure of rejection on catalog read-side | Catalog never returns rejected items, so resolvers don't need to know about `REJECTED` |

---

## User Stories

### P1: Reviewer rejects content under review with a mandatory reason ⭐ MVP

**User Story**: As an admin reviewer, I want to reject content currently in `REVIEW` with a written reason, so the author knows what to fix and the team has an audit record.

**Why P1**: Without this, rejection cannot leave the team's heads — the entire feature exists to capture this single event.

**Acceptance Criteria**:

1. WHEN an admin issues `PATCH /admin/content/:id/transition` with `targetState=REJECTED` and a non-empty `reason` on a content in `REVIEW`, system SHALL transition the content to `REJECTED` and persist a `ContentTransition` row with `previousState=REVIEW`, `newState=REJECTED`, the supplied reason, and `triggeredBy` resolved from the auth context.
2. WHEN an admin issues a transition to `REJECTED` without a reason (missing or empty after trim), system SHALL respond with `422 Unprocessable Entity` and not modify the content.
3. WHEN an admin issues a transition to `REJECTED` from any state other than `REVIEW`, system SHALL respond with `422` quoting the disallowed transition (consistent with current state-machine errors) and not modify the content.
4. WHEN content has a pending scheduled-publish job and is rejected, system SHALL clear `scheduledPublishAt` on the content and cancel the corresponding queue job (same path as `cancel-scheduled-publish.use-case`).
5. WHEN the request originates without an authenticated admin, system SHALL respond with `401`/`403` per the existing `AuthGuard`/`AdminGuard` chain (unchanged behavior).

**Independent Test**: Insert a movie in `REVIEW`, `PATCH .../transition` with `{targetState: "REJECTED", reason: "Thumbnail off-brand"}`, assert content row has `publishingStatus=REJECTED` and a single `ContentTransition` row exists with the reason.

---

### P2: Author re-submits a rejected item by sending it back to draft

**User Story**: As an admin acting on behalf of the author, I want to move rejected content to `DRAFT` so it can be edited and resubmitted to review.

**Why P2**: Without a recovery path, `REJECTED` is a dead-end and reviewers cannot help authors iterate. Demote-to-draft is the minimum viable recovery.

**Acceptance Criteria**:

1. WHEN an admin transitions a `REJECTED` content to `DRAFT`, system SHALL persist the transition and reset the content to `DRAFT` (no quality-gate run, since `DRAFT` is unguarded).
2. WHEN an admin attempts to transition a `REJECTED` content to any state other than `DRAFT`, system SHALL respond with `422` (per existing state-machine guard).

**Independent Test**: Insert a movie in `REJECTED`, `PATCH .../transition` with `{targetState: "DRAFT"}`, assert content row has `publishingStatus=DRAFT` and a `ContentTransition` row exists with `previousState=REJECTED, newState=DRAFT`.

---

### P3: Pipeline dashboard surfaces the rejected count

**User Story**: As a content ops lead, I want to see how many items are currently `REJECTED`, broken down by content type if requested, so I can spot review bottlenecks.

**Why P3**: Important for the team's weekly health check, but the feature is shippable without it (current dashboard already works without `REJECTED`).

**Acceptance Criteria**:

1. WHEN `GET /admin/content/pipeline/summary` is called, the response SHALL include a `rejected: number` field alongside the existing `draft / review / published / archived` counts.
2. WHEN `GET /admin/content/pipeline/summary?breakdown=contentType` is called, the per-`MOVIE`/`TV_SHOW` `breakdown` blocks SHALL each include `rejected`.
3. WHEN listing admin content with `GET /admin/content?status=REJECTED`, the response SHALL contain only items in `REJECTED`.

**Independent Test**: Insert 2 rejected movies and 1 rejected TV show, hit `GET /admin/content/pipeline/summary?breakdown=contentType`, assert totals contain `rejected: 3` and breakdown shows `MOVIE.rejected=2`, `TV_SHOW.rejected=1`.

---

## Edge Cases

- WHEN a request supplies `reason` longer than 500 characters, system SHALL respond with `400` (existing DTO `MaxLength(500)` already covers this; verified, not extended).
- WHEN a request supplies `reason` as whitespace only on a `REJECTED` transition, system SHALL treat it as empty and respond with `422` (trim before validating; new check, since current DTO accepts whitespace).
- WHEN content is in `REVIEW` with `scheduledPublishAt` set and gets rejected, the scheduled queue job SHALL be cancelled atomically with the transition (single transaction). If the queue cancel fails, the transition rolls back.
- WHEN catalog (`CatalogContentRepository.findAll`) is queried, `REJECTED` items SHALL NOT appear (current `where: { publishingStatus: PUBLISHED }` already enforces this — verified by spec, not extended).
- WHEN the pipeline summary is queried for an empty database, `rejected` SHALL still be present in the response with value `0`.
- WHEN a `REJECTED` content is queried via `GET /admin/content/:id`, the response SHALL include `publishingStatus: "REJECTED"`. (No new fields like `lastRejectionReason` — the reason lives in the transitions endpoint to keep the entity clean. See Decisions #4.)
- WHEN listing transitions via `GET /admin/content/:id/transitions`, the rejection's `reason` SHALL be present on the response object (existing DTO already includes `reason`; verified, not extended).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| PREJ-01 | P1: enum extension `REJECTED` | Tasks | Pending |
| PREJ-02 | P1: state machine allows `REVIEW → REJECTED` and `REJECTED → DRAFT` | Tasks | Pending |
| PREJ-03 | P1: reason mandatory on `REJECTED` (use case validation) | Tasks | Pending |
| PREJ-04 | P1: scheduled-publish job auto-cancelled on reject | Tasks | Pending |
| PREJ-05 | P1: DB migration adds `REJECTED` to `publishingStatus` enum | Tasks | Pending |
| PREJ-06 | P1: e2e covering reject happy path + missing reason + invalid source state | Tasks | Pending |
| PREJ-07 | P2: e2e covering `REJECTED → DRAFT` recovery | Tasks | Pending |
| PREJ-08 | P3: `PipelineSummary` exposes `rejected` count + breakdown | Tasks | Pending |
| PREJ-09 | P3: e2e for dashboard summary + admin list filter on `REJECTED` | Tasks | Pending |
| PREJ-10 | Cross-cutting: state-machine unit tests cover new transitions | Tasks | Pending |

**Coverage**: 10 total, all to be mapped to tasks.

---

## Success Criteria

- [ ] A reviewer can reject content in `REVIEW` and the rejection (state + reason + author) is queryable via the existing transitions endpoint
- [ ] An admin can move rejected content back to `DRAFT` for re-submission
- [ ] Pipeline dashboard shows accurate `rejected` counts (total + per content type)
- [ ] No regression: existing transitions (DRAFT→REVIEW, REVIEW→PUBLISHED, PUBLISHED→ARCHIVED, ARCHIVED→PUBLISHED) and quality-gate behavior remain unchanged
- [ ] Catalog read endpoints continue to expose only `PUBLISHED` content (verified by existing tests)
- [ ] Full lint + unit + e2e gate passes: `nx lint:check content && nx test:unit content && nx test:e2e content`

---

## Inline Design Notes (Medium feature, no separate design.md)

### Data model changes

- **Single enum extension**: add `REJECTED = 'REJECTED'` to `PublishingStatus` (`package/content/shared/core/enum/publishing-status.enum.ts`).
- **Migration**: TypeORM-generated `ALTER TYPE "publishing_status_enum" ADD VALUE 'REJECTED'`. Generated via `nx db:generate content`, never hand-rolled.
- **No new columns**. Reason is already captured by `ContentTransition.reason`. Last rejection is derivable by querying the most recent `ContentTransition` for the content with `newState=REJECTED` if a UI needs it; not exposed on the entity to keep state isolated.

### State machine extension

`ContentPublishingStateMachineService.ALLOWED_TRANSITIONS` becomes:

| From | To | Notes |
| --- | --- | --- |
| DRAFT | REVIEW | unchanged |
| REVIEW | PUBLISHED, DRAFT, **REJECTED** | new: `REJECTED` added |
| PUBLISHED | ARCHIVED | unchanged |
| ARCHIVED | PUBLISHED | unchanged |
| **REJECTED** | **DRAFT** | new entry |

### Use-case wiring

`TransitionContentUseCase.execute` adds a single branch alongside the existing `targetState === PUBLISHED` / `REVIEW` / `ARCHIVED` branches:

```
if (targetState === REJECTED) {
  if (!reason || reason.trim().length === 0) throw UnprocessableEntityException('reason required')
  if (content.scheduledPublishAt) {
    await scheduledPublishProducer.cancelScheduledPublish(contentId)  // existing API
    content.scheduledPublishAt = null
  }
}
```

The state-machine call (`stateMachineService.transition`) runs *before* this branch, so an invalid source state throws the standard "Invalid publishing state transition…" error.

### HTTP layer

- `TransitionContentDto`: no change. `targetState: PublishingStatus` already accepts the enum, so once the enum has `REJECTED`, the DTO accepts it for free. `reason` is already optional with `MaxLength(500)`. The use case enforces "required when targetState === REJECTED" rather than the DTO, because that's a cross-field rule (matches existing pattern for `scheduledPublishAt` only-on-REVIEW).
- No new controller / no new endpoint. The existing `PATCH /admin/content/:id/transition` is the surface.

### Pipeline dashboard

- `PipelineStatusCounts` interface gains `rejected: number`.
- `buildEmptyCounts` returns `{ draft: 0, review: 0, published: 0, archived: 0, rejected: 0 }`.
- `statusKey` map gets `[PublishingStatus.REJECTED]: 'rejected'`.
- Repository raw queries `countByPublishingStatus` and `countByPublishingStatusAndContentType` already group by status — no SQL change.

### Catalog read-side

- `CatalogContentRepository.findAll` filters `where: { publishingStatus: PUBLISHED }`. **No change.**
- GraphQL types: no change. `REJECTED` content is filtered before serialization.

### Files touched (estimate)

| File | Change | Layer |
| --- | --- | --- |
| `shared/core/enum/publishing-status.enum.ts` | + `REJECTED` | enum |
| `shared/persistence/migration/<ts>-add-rejected-status.ts` | new (generated) | migration |
| `management/core/service/content-publishing-state-machine.service.ts` | extend map | service |
| `management/core/service/__test__/.spec.ts` | new transitions covered | unit |
| `management/core/use-case/transition-content.use-case.ts` | reject branch | use case |
| `management/core/use-case/pipeline-summary.use-case.ts` | rejected counts | use case |
| `management/__test__/e2e/lifecycle/reject-path.spec.ts` | new | e2e |
| `management/__test__/e2e/lifecycle/pipeline-dashboard.spec.ts` | extend assertions | e2e |
| `management/__test__/e2e/lifecycle/audit-trail.spec.ts` | extend assertions | e2e |

---

## Decisions to Confirm Before Tasks

These are gray areas where I picked an opinionated default. Flag any you want to change.

1. **`REJECTED` is reachable only from `REVIEW`** (not from `DRAFT` or `PUBLISHED`). Rejection is a review-stage concept.
2. **Recovery path is `REJECTED → DRAFT` only** (not directly back to `REVIEW`). Forces the author to acknowledge by editing and resubmitting.
3. **Reason is mandatory** on the reject transition, validated in the use case (cross-field rule). Whitespace-only counts as empty.
4. **No new columns on `Content`** for "last rejection reason" — the audit trail (`ContentTransition`) is the single source of truth. Admin UI reads from `GET /admin/content/:id/transitions`.
5. **No new role**. Existing `AdminGuard` is sufficient; introducing a `reviewer` role is identity-package work and out of scope.
6. **Pending scheduled-publish jobs are auto-cancelled** when a rejected item had been on the schedule (atomic with the transition).
7. **Catalog filter unchanged**. `REJECTED` is already excluded by the existing `publishingStatus = PUBLISHED` clause.
8. **Migration generated** via `nx db:generate content`, never hand-rolled (per workspace rule). The generated migration is reviewed for safety (Postgres `ALTER TYPE … ADD VALUE` cannot run inside a transaction in some versions — flagged for review during execution).
