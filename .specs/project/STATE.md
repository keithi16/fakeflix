# State — Persistent Memory

**Last updated:** 2026-03-31

## Decisions

| ID | Decision | Rationale | Date |
|---|---|---|---|
| DEC-01 | State machine will follow billing module's `SubscriptionStateMachineService` pattern | Proven pattern in codebase: `Map<Status, AllowedStatuses[]>` + `transition()` method | 2026-03-31 |
| DEC-02 | publishingStatus goes on `Content` entity (content/shared) | Shared across management, catalog, and media subdomains — all need visibility | 2026-03-31 |
| DEC-03 | Catalog filtering at repository level, not use-case level | Prevents "forgotten filter" risk per PRD; repository is the single point of control | 2026-03-31 |
| DEC-04 | Data migration sets all existing content to PUBLISHED | Backward compatibility — no visible change to current users post-migration | 2026-03-31 |
| DEC-05 | New content defaults to DRAFT | Core behavioral change — content is invisible until explicitly published | 2026-03-31 |
| DEC-06 | Three milestones: P0 (core), P1 (editorial ops), P2 (operational excellence) | Natural dependency chain; each milestone is independently shippable | 2026-03-31 |

## Open Questions (from PRD)

| ID | Question | Owner | Status |
|---|---|---|---|
| QA-01 | Post-archival access: allow users who started watching to finish, or cut immediately? | Product + Legal | Open |
| QA-02 | REVIEW state: lockdown edits or soft review (edits still allowed, just not public)? | Product | Open |
| QA-03 | Domain events on transitions (ContentPublished, ContentArchived) vs pull-only via facade for V1? | Engineering | Open — V1 can start without events; facade pull is sufficient |
| QA-04 | Scheduled publishing: cron job or BullMQ delayed jobs? | Engineering | Leaning BullMQ — already in stack, delayed jobs built-in |
| QA-05 | Scheduling failure: transition to SCHEDULING_FAILED state or return to DRAFT? | Product | Open |

## Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Legacy data without publishingStatus breaks catalog after migration | High | High | Migration assigns PUBLISHED to all existing rows; run migration before deploying new code |
| Quality gates block publication because AI pipeline (ageRecommendation) is slow | Medium | High | Gate checks are synchronous — if ageRecommendation is null, gate fails. Consider async gate or warning mode |
| Forgotten publishingStatus filter in future queries exposes drafts | Medium | High | Filter at repository level, never at caller; e2e tests verify filtering |
| Scheduled job fails silently | Medium | High | Structured logging on job execution; SCHEDULING_FAILED state as signal |

## Blockers

None currently.

## Lessons Learned

(None yet — will be populated during implementation.)

## Deferred Ideas

| Idea | Why Deferred | Revisit When |
|---|---|---|
| Domain events for state transitions | V1 can use facade pull; events add complexity | M2 or when async subscribers needed |
| Content metadata versioning | Not blocking for lifecycle; nice-to-have for compliance | Future consideration |
| Per-episode publishing | V1 operates at content level (whole movie/series) | V2 |

## Preferences

(None yet.)
