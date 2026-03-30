# Core Personalization Specification

## Problem Statement

Fakeflix has no personalization layer. Every user sees the same catalog in the same order. Users spend 4–7 minutes browsing before pressing play, and 23% of sessions end without a single play event. The two highest-leverage surfaces to fix this are: (1) a personalized content row that reflects the user's taste, and (2) a "continue watching" row that lets users resume immediately — the most direct reducer of time-to-play.

## Goals

- [ ] Reduce average time-to-play from 4–7 min to < 2 min
- [ ] Increase play events originating from a recommendation surface to > 40%
- [ ] Increase sessions with > 1 play event from 31% to > 45%

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Real-time recommendation updates | Batch computation is sufficient for v1 (AD-001) |
| Collaborative filtering ("users like you") | Requires ML infrastructure (AD-002) |
| Trending, genre, new releases rows | M2 scope — separate feature spec |
| Content similarity ("Because You Watched") | M3 scope — requires content metadata enrichment |
| Editorial boost admin API | M3 scope |
| Explainability labels on rows | Planned for v1.1 |
| Parental controls / plan-based filtering | Profiles module doesn't exist yet (PRD QA-05) |
| Recommendation effectiveness tracking | M4 scope |

---

## User Stories

### P1: Personalized Row ("Recommended for You") — MVP

**User Story**: As a logged-in user, I want to see a personalized row of content on the home screen, adapted to my genre preferences and viewing history, so that I find something to watch without manual browsing.

**Why P1**: This is the primary recommendation surface. Every other row type is an extension of this core capability.

**Acceptance Criteria**:

1. WHEN a logged-in user requests their home screen recommendations THEN system SHALL return a "Recommended for You" row with up to 20 content items, ordered by personalization score — `REC-01`
2. WHEN a user has viewing history THEN system SHALL weight their genre affinities (from `AnalyticsApi.getUserGenreAffinities`) to rank content they have not yet watched — `REC-02`
3. WHEN a user has no viewing history (new user) THEN system SHALL fall back to trending content (from `AnalyticsApi.getTrendingContent`) for the "Recommended for You" row — `REC-03`
4. WHEN a user has completed a content item (>= 90% watched) THEN that content SHALL NOT appear in their personalized recommendations — `REC-04`
5. WHEN a user's genre affinities change (new viewing events processed by analytics) THEN their recommendations SHALL be updated within 24 hours (next scheduled batch recomputation) — `REC-05`
6. WHEN a user is not logged in THEN system SHALL return a trending-based row (no personalization) — `REC-06`

**Independent Test**: Call `GET /recommendations?userId={id}` — logged-in user with watch history sees genre-weighted results; new user sees trending; completed items are excluded.

---

### P1: Continue Watching Row — MVP

**User Story**: As a logged-in user, I want to see content I started but didn't finish in a dedicated "Continue Watching" row, so that I can resume immediately without searching.

**Why P1**: This is the most direct reducer of time-to-play. Users who started something are the highest-intent group.

**Acceptance Criteria**:

1. WHEN a user has partially watched content (> 5% and < 90% complete) THEN it SHALL appear in the "Continue Watching" row, ordered by most recently watched first — `CW-01`
2. WHEN a user has completed a content item (>= 90%) THEN it SHALL be automatically removed from "Continue Watching" — `CW-02`
3. WHEN a user requests resume position for a "Continue Watching" item THEN system SHALL return the last known playback position (from `AnalyticsApi.getUserResumePosition`) — `CW-03`
4. WHEN "Continue Watching" has more than 20 items THEN only the 20 most recently watched SHALL be returned — `CW-04`
5. WHEN a user explicitly dismisses a "Continue Watching" item THEN it SHALL NOT reappear in that row, even if the user re-watches from the beginning — `CW-05`

**Independent Test**: Call `GET /recommendations/continue-watching?userId={id}` — returns partially-watched items with resume positions; completed items excluded; dismissed items excluded; capped at 20.

---

## Edge Cases

- WHEN a user has genre affinities but the catalog has fewer than 20 matching unwatched items THEN system SHALL return as many as available (no padding with irrelevant content) — `REC-07`
- WHEN analytics data is unavailable (service down or empty response) THEN system SHALL fall back to trending content for personalized row and return an empty "Continue Watching" row — `REC-08`
- WHEN a user has no partially-watched content THEN "Continue Watching" SHALL return an empty row (not omitted — the client decides display logic) — `CW-06`
- WHEN a dismissed item's content is removed from the catalog THEN the dismiss record SHALL be cleaned up on next access (no orphaned dismiss records blocking queries) — `CW-07`
- WHEN a user rapidly watches and completes content THEN the transition from "Continue Watching" to "excluded from recommendations" SHALL happen on the next batch recomputation, not in real-time — `REC-09`

---

## Dependencies & Constraints

### Available Analytics Facades (via `AnalyticsApi` from `@tlc/shared-module/public-api`)

| Method | Returns | Used By |
| --- | --- | --- |
| `getUserGenreAffinities(userId)` | `GenreAffinityItem[]` (genre, affinityScore, totalWatchTimeMs, contentCount) | REC-02 |
| `getUserWatchHistory(userId, options?)` | `UserWatchHistoryItem[]` (contentId, completionPercentage, completed, lastWatchedAt) | REC-04, CW-01, CW-02 |
| `getUserResumePosition(userId, contentId)` | `ResumePosition \| null` (positionMs, completionPercentage) | CW-03 |
| `getTrendingContent(windowType, limit?)` | `TrendingContentItem[]` (contentId, rank, trendingScore) | REC-03, REC-06 |
| `getContentPerformanceMetrics(contentId)` | `ContentPerformanceMetrics \| null` (totalViews, avgCompletionPercentage) | Scoring input |

### Missing: Content-by-Genre Query

The content module's `Content` entity has no `genre` or `tag` fields. There is no catalog query API to fetch "all content in genre X." The analytics module knows user genre affinities but there's no way to match those to catalog content.

**This must be resolved in the Design phase.** Options include:
1. Add genre metadata to content entities (content module change)
2. Use analytics aggregation data that already maps content to genres internally
3. Build a genre-content index in the recommendations module

### Dismiss State

"Continue Watching" requires persistent dismiss state (CW-05). This is new data owned by the recommendations module — not available in analytics.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status | Task |
| --- | --- | --- | --- | --- |
| REC-01 | P1: Personalized Row | Tasks | Pending | T8, T9, T11 |
| REC-02 | P1: Personalized Row | Tasks | Pending | T6, T11 |
| REC-03 | P1: Personalized Row | Tasks | Pending | T8, T11 |
| REC-04 | P1: Personalized Row | Tasks | Pending | T6, T11 |
| REC-05 | P1: Personalized Row | Tasks | Pending | T10, T11 |
| REC-06 | P1: Personalized Row | Tasks | Pending | T8, T9, T11 |
| REC-07 | P1: Personalized Row (edge) | Tasks | Pending | T6, T11 |
| REC-08 | P1: Personalized Row (edge) | Tasks | Pending | T7, T8, T11 |
| REC-09 | P1: Personalized Row (edge) | Tasks | Pending | T6 |
| CW-01 | P1: Continue Watching | Tasks | Pending | T7, T11 |
| CW-02 | P1: Continue Watching | Tasks | Pending | T7, T11 |
| CW-03 | P1: Continue Watching | Tasks | Pending | T7, T11 |
| CW-04 | P1: Continue Watching | Tasks | Pending | T7, T11 |
| CW-05 | P1: Continue Watching | Tasks | Pending | T5, T7, T11 |
| CW-06 | P1: Continue Watching (edge) | Tasks | Pending | T7, T11 |
| CW-07 | P1: Continue Watching (edge) | Tasks | Pending | T7 |

**Coverage:** 16 total, 16 mapped to tasks, 0 unmapped

---

## Success Criteria

How we know the feature is successful:

- [ ] `GET /recommendations?userId={id}` returns personalized results for users with history, trending for new users
- [ ] `GET /recommendations/continue-watching?userId={id}` returns partially-watched items with resume positions
- [ ] Completed content (>= 90%) never appears in either row
- [ ] Dismissed "Continue Watching" items never reappear
- [ ] Analytics fallback works gracefully when analytics data is unavailable
- [ ] E2E tests cover all P1 acceptance criteria
- [ ] Unit tests cover scoring logic and edge cases
