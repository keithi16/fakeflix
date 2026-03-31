# Roadmap

**Current Milestone:** M1 — Core Publishing Lifecycle
**Status:** Planning

---

## M1: Core Publishing Lifecycle (P0)

**Goal:** Content is no longer immediately visible upon creation. The system enforces a state machine (DRAFT → REVIEW → PUBLISHED → ARCHIVED) with quality gates, and the public catalog only returns PUBLISHED content. This is the minimum shippable increment that solves the core problem.

**Target:** Foundation for all subsequent features.

### Features

**content-lifecycle-core** - PLANNED

- Publishing state machine on ContentItem entity (DRAFT, REVIEW, PUBLISHED, ARCHIVED)
- State transition validation (only allowed transitions)
- Admin endpoint: `PATCH /admin/content/:id/transition` with `targetState`
- Quality gates before REVIEW → PUBLISHED (thumbnail, description ≥50 chars, genre, age rating, episodes for TV shows)
- Catalog filtering: public APIs return only PUBLISHED content
- Cross-module transparency: `ContentCatalogApi` facade returns only PUBLISHED
- Data migration: existing content → PUBLISHED
- Admin content listing with status filter: `GET /admin/content?status=...`

---

## M2: Editorial Operations (P1)

**Goal:** Content team can schedule future publications, archive content non-destructively, and see pipeline state at a glance. Operational capabilities that build on M1's foundation.

**Target:** After M1 is verified and stable.

### Features

**editorial-operations** - PLANNED

- Scheduled publishing: `scheduledPublishAt` field on REVIEW content, BullMQ delayed job, auto-gate-check at scheduled time
- Content archiving: PUBLISHED → ARCHIVED (preserves data), ARCHIVED → PUBLISHED (re-gates)
- Pipeline dashboard: `GET /admin/content/pipeline/summary` (counts by state), optional content type breakdown, recent transitions

---

## M3: Operational Excellence (P2)

**Goal:** Governance, traceability, and bulk efficiency. Not blocking for editorial operations but important for audit and scale.

**Target:** After M2 is verified.

### Features

**operational-excellence** - PLANNED

- Full audit trail: `GET /admin/content/:id/transitions` with history, triggeredBy, optional reason
- Bulk transitions: `POST /admin/content/bulk-transition` (up to 50 items, partial success/failure)

---

## Future Considerations

- Multi-step approval workflows (editor → reviewer → director)
- Public preview links for stakeholder review
- Per-episode publishing granularity
- License-based auto-depublication
- Automated stale-content notifications
- Regional availability controls
