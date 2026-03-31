# Operational Excellence Specification

## Problem Statement

With the lifecycle pipeline and editorial operations in place (M1+M2), the team lacks governance traceability (who changed what and when) and bulk operational efficiency (transitioning many items one-by-one is tedious). These capabilities are important for audit, compliance, and day-to-day efficiency but don't block core editorial operations.

## Goals

- [ ] Full audit trail for every content state transition (who, what, when, why)
- [ ] Bulk transitions for up to 50 content items in a single API call with partial success reporting

## Out of Scope

| Feature | Reason |
|---|---|
| Audit trail for metadata edits (title, description changes) | Metadata versioning is a separate feature |
| Bulk scheduling | Scheduling is per-item with specific dates; bulk doesn't apply naturally |
| Audit log export/download | Operational tooling, not core audit trail |

---

## User Stories

### P2: Transition History (Audit Trail)

**User Story:** As a content manager, I want to see the complete history of state transitions for any content item, so that I have full traceability of who did what and when in the editorial pipeline.

**Why P2:** Important for governance and debugging, but doesn't block day-to-day operations.

**Acceptance Criteria:**

1. WHEN an admin calls `GET /admin/content/:id/transitions` THEN the system SHALL return the complete transition history for that content, ordered most recent first
2. WHEN a transition is recorded THEN it SHALL include: `id`, `previousState`, `newState`, `triggeredBy` (userId), `timestamp`, `reason` (optional text)
3. WHEN an admin transitions content from `REVIEW` back to `DRAFT` THEN they SHALL be able to optionally provide a `reason` describing the rejection
4. WHEN the transition history is queried THEN it SHALL include automatic transitions (e.g., scheduled publishing) with `triggeredBy: SYSTEM`

**Independent Test:** Create content → transition through several states with optional reasons → query transitions endpoint → verify full history with correct order, actors, and timestamps.

---

### P2: Bulk State Transitions

**User Story:** As a content manager, I want to transition multiple content items at once, so that I can efficiently publish or archive batches of titles without individual API calls.

**Why P2:** Operational efficiency — the individual transition endpoint (P0) is functionally sufficient.

**Acceptance Criteria:**

1. WHEN an admin calls `POST /admin/content/bulk-transition` with `contentIds[]` and `targetState` THEN the system SHALL attempt to transition each content item individually
2. WHEN any item in the batch fails (invalid transition or quality gate failure) THEN the system SHALL continue processing remaining items and return partial results: `{ succeeded: [{id, newState}], failed: [{id, reason}] }`
3. WHEN the batch exceeds 50 items THEN the system SHALL return `400 Bad Request` with a limit message
4. WHEN bulk transitions are executed THEN each individual transition SHALL generate its own audit trail record (not a single record for the batch)

**Independent Test:** Create 5 content items in various states → bulk transition to PUBLISHED → verify partial success (items that pass gates succeed, others fail) → verify audit trail has individual entries.

---

## Edge Cases

- WHEN `GET /admin/content/:id/transitions` is called for content with no transitions THEN the system SHALL return an empty array (the initial DRAFT state is set at creation, not via transition)
- WHEN bulk-transition includes duplicate content IDs THEN the system SHALL process each occurrence (first succeeds, second may fail if already in target state)
- WHEN bulk-transition is called with an empty `contentIds` array THEN the system SHALL return `400 Bad Request`
- WHEN a transition `reason` exceeds 500 characters THEN the system SHALL truncate or reject with validation error

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| OPEX-01 | P2: Audit Trail — GET transitions history endpoint | Design | Pending |
| OPEX-02 | P2: Audit Trail — transition record fields (id, states, triggeredBy, timestamp, reason) | Design | Pending |
| OPEX-03 | P2: Audit Trail — optional reason on REVIEW→DRAFT | Design | Pending |
| OPEX-04 | P2: Audit Trail — SYSTEM as triggeredBy for automated transitions | Design | Pending |
| OPEX-05 | P2: Bulk Transitions — POST endpoint with contentIds and targetState | Design | Pending |
| OPEX-06 | P2: Bulk Transitions — partial success/failure response | Design | Pending |
| OPEX-07 | P2: Bulk Transitions — 50-item limit | Design | Pending |
| OPEX-08 | P2: Bulk Transitions — individual audit trail per item | Design | Pending |

**Coverage:** 8 total, 0 mapped to tasks, 8 unmapped

---

## Success Criteria

- [ ] Complete transition history is queryable for any content item
- [ ] Audit records include actor (admin or SYSTEM), timestamps, and optional reasons
- [ ] Bulk transitions handle partial failures gracefully with clear reporting
- [ ] Each individual transition in a bulk operation generates its own audit record
- [ ] All e2e tests pass for audit trail queries and bulk transition scenarios
