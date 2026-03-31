# Content Lifecycle Core Specification

## Problem Statement

Fakeflix treats content creation as an atomic event — items appear in the public catalog the instant they're created via the admin API. This exposes incomplete content (missing thumbnails, placeholder descriptions, no age rating), prevents scheduled launches, and forces destructive deletes as the only way to remove content. The editorial team has zero control over content visibility.

## Goals

- [ ] Zero incomplete content visible in the public catalog (enforced by quality gates)
- [ ] Every content item has an explicit publishing state (DRAFT, REVIEW, PUBLISHED, ARCHIVED)
- [ ] Public catalog APIs return only PUBLISHED content — transparent to all consumers
- [ ] Admin API supports state transitions with validation and error reporting

## Out of Scope

| Feature | Reason |
|---|---|
| Scheduled publishing | P1 — core state machine must be solid first |
| Multi-step approval workflow | V2 — V1 uses manual transitions by any admin |
| Domain events on transitions | V1 uses facade pull; events deferred to M2 |
| Per-episode publishing | V2 — operates at content level (movie/series) |

---

## User Stories

### P0: Content Publishing State Machine

**User Story:** As a content manager, I want each content item to have an explicit publishing state, so that I know exactly where it is in the editorial pipeline and can control when it becomes visible.

**Why P0:** Foundational capability — all other stories depend on states existing in the data model.

**Acceptance Criteria:**

1. WHEN a content item is created via the admin API THEN the system SHALL set its initial state to `DRAFT` and it SHALL NOT be visible in the public catalog
2. WHEN an admin calls `PATCH /admin/content/:id/transition` with `targetState: REVIEW` THEN the system SHALL transition the content from `DRAFT` to `REVIEW`, validating the transition is allowed
3. WHEN an admin calls the transition from `REVIEW` to `PUBLISHED` THEN the system SHALL validate quality gates (see P0: Quality Gates) before allowing the transition
4. WHEN an admin attempts an invalid transition (e.g., `DRAFT` → `PUBLISHED`, `ARCHIVED` → `REVIEW`) THEN the system SHALL return `422 Unprocessable Entity` with a message describing allowed transitions from the current state
5. WHEN a content item's state changes THEN the system SHALL record the transition with `previousState`, `newState`, `triggeredBy` (admin userId), and `timestamp`
6. WHEN an admin calls `GET /admin/content/:id` THEN the response SHALL include the `publishingStatus` field with the current state

**Independent Test:** Create content via admin API → verify state is DRAFT → transition to REVIEW → verify state changed → attempt invalid transition → verify 422 response.

---

### P0: Quality Gates for Publication

**User Story:** As a content quality analyst, I want the system to prevent publication of content that doesn't meet minimum quality criteria, so that no incomplete content reaches the public catalog.

**Why P0:** Without automated gates, the state machine alone doesn't prevent accidental publication of incomplete content.

**Acceptance Criteria:**

1. WHEN an admin transitions content from `REVIEW` to `PUBLISHED` THEN the system SHALL validate: (a) at least one thumbnail exists, (b) description is non-empty with ≥50 characters, (c) at least one genre is assigned, (d) `ageRecommendation` is not null
2. WHEN the content is a `TV_SHOW` THEN the system SHALL additionally validate that at least 1 episode exists
3. WHEN any quality gate fails THEN the system SHALL return `422` with an array of validation failures, each with `field`, `rule`, and `message`
4. WHEN a gate fails THEN the content state SHALL remain unchanged (`REVIEW`)
5. WHEN all gates pass THEN the transition SHALL proceed and the content SHALL become visible in the public catalog

**Independent Test:** Create content in REVIEW with missing thumbnail → attempt transition to PUBLISHED → verify 422 with gate failure details → add thumbnail + fix other gates → retry → verify success.

---

### P0: Catalog Filters by Publishing Status

**User Story:** As a Fakeflix user, I want the catalog to only show content that is officially published, so that I never encounter incomplete or in-preparation titles.

**Why P0:** This is the entire value proposition — without filtering, the state machine is overhead with no user benefit.

**Acceptance Criteria:**

1. WHEN the public catalog is queried (GraphQL `listContent`, `ContentCatalogFacade`) THEN only content with `publishingStatus = PUBLISHED` SHALL be returned
2. WHEN content transitions from `PUBLISHED` to `ARCHIVED` THEN it SHALL disappear from the public catalog within 1 minute (eventual consistency acceptable)
3. WHEN content transitions to `PUBLISHED` THEN it SHALL appear in the public catalog within 1 minute
4. WHEN the admin API lists content (`GET /admin/content`) THEN it SHALL return content of ALL states, with an optional `?status=DRAFT,REVIEW` filter
5. WHEN the recommendations module queries catalog via `ContentCatalogApi` THEN it SHALL receive only `PUBLISHED` content — filtering is the responsibility of the content module, not the consumer

**Independent Test:** Create content (DRAFT) → verify not in catalog → transition to PUBLISHED → verify appears in catalog → create another DRAFT → verify only PUBLISHED content returned.

---

## Edge Cases

- WHEN content has `publishingStatus = null` (legacy data pre-migration) THEN the migration SHALL have already set it to `PUBLISHED` — no null handling needed in application code
- WHEN an admin transitions content from `REVIEW` back to `DRAFT` THEN the content SHALL remain invisible in the public catalog
- WHEN an admin transitions content from `ARCHIVED` back to `PUBLISHED` THEN the system SHALL re-execute quality gates before allowing republication
- WHEN `PATCH /admin/content/:id/transition` is called with a non-existent content ID THEN the system SHALL return `404 Not Found`
- WHEN the transition request body is missing `targetState` THEN the system SHALL return `400 Bad Request`
- WHEN a content item of type MOVIE has no episodes THEN the episode gate SHALL NOT apply (movie-only gates)

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| LIFECYCLE-01 | P0: State Machine — initial DRAFT state on creation | Design | Pending |
| LIFECYCLE-02 | P0: State Machine — transition endpoint | Design | Pending |
| LIFECYCLE-03 | P0: State Machine — quality gate validation on REVIEW→PUBLISHED | Design | Pending |
| LIFECYCLE-04 | P0: State Machine — invalid transition returns 422 | Design | Pending |
| LIFECYCLE-05 | P0: State Machine — transition audit record | Design | Pending |
| LIFECYCLE-06 | P0: State Machine — publishingStatus in admin GET response | Design | Pending |
| LIFECYCLE-07 | P0: Quality Gates — thumbnail, description, genre, ageRecommendation | Design | Pending |
| LIFECYCLE-08 | P0: Quality Gates — TV_SHOW episode check | Design | Pending |
| LIFECYCLE-09 | P0: Quality Gates — 422 with failure array | Design | Pending |
| LIFECYCLE-10 | P0: Quality Gates — state unchanged on failure | Design | Pending |
| LIFECYCLE-11 | P0: Catalog Filter — public queries return only PUBLISHED | Design | Pending |
| LIFECYCLE-12 | P0: Catalog Filter — admin listing returns all states with optional filter | Design | Pending |
| LIFECYCLE-13 | P0: Catalog Filter — cross-module facade returns only PUBLISHED | Design | Pending |
| LIFECYCLE-14 | P0: Catalog Filter — ARCHIVED→PUBLISHED re-gates | Design | Pending |

**Coverage:** 14 total, 0 mapped to tasks, 14 unmapped

---

## Success Criteria

- [ ] Creating content via admin API results in DRAFT state — not visible in catalog
- [ ] Only valid state transitions succeed; invalid ones return 422 with allowed transitions
- [ ] Content cannot transition to PUBLISHED without passing all quality gates
- [ ] Public catalog (GraphQL + facade) returns exclusively PUBLISHED content
- [ ] Existing content continues to appear in catalog after migration (backward compatibility)
- [ ] All e2e tests pass for state transitions, quality gates, and catalog filtering
