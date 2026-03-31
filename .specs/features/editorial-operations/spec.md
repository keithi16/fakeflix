# Editorial Operations Specification

## Problem Statement

With the core lifecycle in place (M1), the editorial team still lacks three operational capabilities: scheduling future publications (forcing manual timing), non-destructive content removal (only destructive deletes exist), and pipeline visibility (no dashboard to see content distribution across states). These are the highest-value improvements after the foundation.

## Goals

- [ ] Content managers can schedule publication for a future date/time (eliminating manual launch timing)
- [ ] Content can be archived non-destructively and republished when needed
- [ ] Pipeline dashboard provides at-a-glance visibility into editorial state distribution

## Out of Scope

| Feature | Reason |
|---|---|
| Auto-depublication by license expiry | Requires licensing system that doesn't exist |
| Email/Slack notifications on scheduling events | Operational alerting feature, not core lifecycle |
| Post-archival temporary access for in-progress viewers | QA-01 still open; deferred |
| Content metadata edit lockdown in REVIEW state | QA-02 still open; V1 uses soft review |

---

## User Stories

### P1: Scheduled Publishing

**User Story:** As a content manager, I want to schedule content publication for a future date and time, so that I can prepare launches in advance and ensure content goes live at the optimal moment.

**Why P1:** High value for the Sofia persona, but manual publishing (P0) is a functional fallback.

**Acceptance Criteria:**

1. WHEN an admin transitions content to `REVIEW` THEN they SHALL be able to optionally provide `scheduledPublishAt` with a future UTC date/time
2. WHEN `scheduledPublishAt` is provided THEN the system SHALL validate the date is at least 15 minutes in the future; quality gates are checked at publish time, not at scheduling time
3. WHEN the scheduled time arrives THEN the system SHALL execute quality gates automatically; IF all pass, transition to `PUBLISHED`; IF any fail, mark as `SCHEDULING_FAILED` and log structured error
4. WHEN an admin calls `GET /admin/content?status=REVIEW&scheduled=true` THEN the system SHALL return review content with scheduled dates, including the `scheduledPublishAt` field
5. WHEN an admin calls `DELETE /admin/content/:id/schedule` THEN the schedule SHALL be cancelled and content remains in `REVIEW` without a scheduled date
6. WHEN a schedule is cancelled or fails THEN the system SHALL preserve the original `scheduledPublishAt` and add `schedulingOutcome` (`CANCELLED` or `FAILED_VALIDATION`) with timestamp

**Independent Test:** Create content → transition to REVIEW with scheduledPublishAt → verify scheduled state → trigger job execution → verify gates run and content transitions (or fails with SCHEDULING_FAILED).

---

### P1: Content Archiving

**User Story:** As a content manager, I want to archive content that has been removed from circulation without losing historical data, so that I can manage the catalog lifecycle safely and reversibly.

**Why P1:** Today the only option is destructive delete — archiving is essential for compliance and editorial operations.

**Acceptance Criteria:**

1. WHEN an admin transitions `PUBLISHED` content to `ARCHIVED` THEN the content SHALL disappear from the public catalog but remain accessible via admin API
2. WHEN content is archived THEN all data (metadata, videos, thumbnails, historical metrics) SHALL be preserved
3. WHEN an admin transitions `ARCHIVED` content back to `PUBLISHED` THEN the system SHALL re-execute quality gates before allowing republication
4. WHEN content is archived THEN it SHALL be excluded from recommendation computation on the next cycle, but SHALL remain in "Continue Watching" lists for users who started it (with eventual removal — frontend concern)
5. WHEN admin lists archived content (`GET /admin/content?status=ARCHIVED`) THEN the response SHALL include `archivedAt` and `archivedBy` fields

**Independent Test:** Publish content → verify in catalog → archive → verify gone from catalog + still in admin API → republish (re-gates) → verify back in catalog.

---

### P1: Pipeline Dashboard

**User Story:** As a content manager, I want to see how many content items are in each pipeline state, so that I can identify bottlenecks and plan the editorial calendar.

**Why P1:** Simple aggregation over data that exists with the state machine — high value, low complexity.

**Acceptance Criteria:**

1. WHEN an admin calls `GET /admin/content/pipeline/summary` THEN the system SHALL return counts per state: `{ draft: N, review: N, published: N, archived: N }`
2. WHEN an admin calls `GET /admin/content/pipeline/summary?breakdown=contentType` THEN the system SHALL return counts grouped by content type (MOVIE, TV_SHOW) and state
3. WHEN an admin calls `GET /admin/content/pipeline/recent-transitions` THEN the system SHALL return the last 50 transitions with `contentId`, `title`, `previousState`, `newState`, `triggeredBy`, and `timestamp`, ordered by timestamp descending

**Independent Test:** Create several content items in various states → call summary endpoint → verify counts match → call recent-transitions → verify list reflects actual transitions.

---

## Edge Cases

- WHEN `scheduledPublishAt` is in the past THEN the system SHALL return `422` with a message that the date must be at least 15 minutes in the future
- WHEN a scheduled job fires but the content has been manually transitioned since scheduling THEN the job SHALL be a no-op (content is no longer in REVIEW)
- WHEN archiving content that is referenced in precomputed recommendations THEN recommendations continue serving stale data until next recomputation — acceptable eventual consistency
- WHEN the pipeline summary is called with no content in the database THEN all counts SHALL be 0

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| EDITORIAL-01 | P1: Scheduled Publishing — scheduledPublishAt on REVIEW transition | Design | Pending |
| EDITORIAL-02 | P1: Scheduled Publishing — 15-minute minimum future validation | Design | Pending |
| EDITORIAL-03 | P1: Scheduled Publishing — BullMQ delayed job with auto-gate-check | Design | Pending |
| EDITORIAL-04 | P1: Scheduled Publishing — admin listing of scheduled content | Design | Pending |
| EDITORIAL-05 | P1: Scheduled Publishing — cancel schedule endpoint | Design | Pending |
| EDITORIAL-06 | P1: Scheduled Publishing — SCHEDULING_FAILED state on gate failure | Design | Pending |
| EDITORIAL-07 | P1: Archiving — PUBLISHED→ARCHIVED removes from catalog | Design | Pending |
| EDITORIAL-08 | P1: Archiving — data preservation on archive | Design | Pending |
| EDITORIAL-09 | P1: Archiving — ARCHIVED→PUBLISHED re-gates | Design | Pending |
| EDITORIAL-10 | P1: Archiving — exclusion from recommendation computation | Design | Pending |
| EDITORIAL-11 | P1: Archiving — archivedAt/archivedBy fields | Design | Pending |
| EDITORIAL-12 | P1: Dashboard — state count summary | Design | Pending |
| EDITORIAL-13 | P1: Dashboard — content type breakdown | Design | Pending |
| EDITORIAL-14 | P1: Dashboard — recent transitions list | Design | Pending |

**Coverage:** 14 total, 0 mapped to tasks, 14 unmapped

---

## Success Criteria

- [ ] Content can be scheduled for future publication and the system auto-publishes at the right time
- [ ] Quality gates are re-checked at scheduled publish time (not at scheduling time)
- [ ] Archiving removes content from catalog without data loss
- [ ] Archived content can be republished after re-passing quality gates
- [ ] Pipeline dashboard returns accurate counts that match actual content states
- [ ] All e2e tests pass for scheduling, archiving, and dashboard endpoints
