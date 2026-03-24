# Analytics Specification

## Problem Statement

Fakeflix has no visibility into how users interact with content. There is no watch history, no "continue watching" capability, no content performance data for admins, and no trending/engagement metrics. This makes it impossible to understand what content performs well, how users consume it, or to build data-driven features like recommendations.

## Goals

- [ ] Capture user playback events (play, pause, resume, stop, complete) and watch progress heartbeats in an append-only event store
- [ ] Asynchronously process raw events into pre-computed read models via BullMQ (Light CQRS)
- [ ] Provide user-centric metrics: watch history, binge session detection, genre affinity scoring
- [ ] Provide content-centric metrics: view counts, completion rates, total watch time, trending rankings
- [ ] Expose a rich admin dashboard API with time-range filtering and CSV export
- [ ] Expose analytics data to other modules via a public API facade (watch history, resume position, trending, content performance, genre affinities)

## Out of Scope

| Feature | Reason |
|---|---|
| Real-time streaming dashboards (WebSocket) | Adds infrastructure complexity; batch-computed metrics are sufficient for learning |
| Event replay / full event sourcing | Append-only without replay keeps complexity manageable while teaching the core pattern |
| A/B testing framework | Separate concern; would warrant its own module |
| Rich playback events (seek, skip-intro, quality-change) | Core events (play/pause/resume/stop/complete) are sufficient; can extend later |
| User-facing analytics UI | This module provides APIs only; UI is a separate frontend concern |
| Data retention / partitioning | Future optimisation; not needed for initial implementation |

---

## User Stories

### P1: Record Player Events ⭐ MVP

**User Story**: As a streaming client, I want to send playback events to the server so that my viewing activity is recorded.

**Why P1**: Without event capture, nothing else works — this is the write path foundation.

**Acceptance Criteria**:

1. WHEN a player sends a valid event (play/pause/resume/stop/complete) with contentId, sessionId, positionMs, durationMs THEN the system SHALL persist it as an append-only record in `AnalyticsViewEvent` and return `202 Accepted`
2. WHEN a player sends an event without a valid auth token THEN the system SHALL return `401 Unauthorized`
3. WHEN a player sends an event with missing required fields THEN the system SHALL return `400 Bad Request` with validation errors
4. WHEN a PLAY, STOP, or COMPLETE event is persisted THEN the system SHALL enqueue an aggregation job to BullMQ

**Independent Test**: Send a POST to `/analytics/events` with a valid payload, verify 202 response and row in database.

---

### P1: Record Watch Progress Heartbeats ⭐ MVP

**User Story**: As a streaming client, I want to send periodic heartbeat signals so that the system knows exactly where I am in the content.

**Why P1**: Heartbeats enable accurate "continue watching" position tracking — a core streaming feature.

**Acceptance Criteria**:

1. WHEN a player sends a batch of heartbeats (array of positionMs + sessionId + contentId + occurredAt) THEN the system SHALL bulk-insert all heartbeats into `AnalyticsHeartbeat` and return `202 Accepted` with the count
2. WHEN a heartbeat batch contains a heartbeat where `positionMs / durationMs >= 0.90` THEN the system SHALL also enqueue a COMPLETE aggregation job
3. WHEN a player sends an empty heartbeat array THEN the system SHALL return `400 Bad Request`
4. WHEN a player sends a heartbeat batch without a valid auth token THEN the system SHALL return `401 Unauthorized`

**Independent Test**: Send a POST to `/analytics/heartbeat` with 5 heartbeats, verify 202 response with `count: 5` and 5 rows in database.

---

### P1: Compute User Watch History ⭐ MVP

**User Story**: As a user, I want the system to track where I left off in each piece of content so that I can resume watching.

**Why P1**: "Continue watching" is a fundamental streaming service feature and the primary consumer of the aggregation pipeline.

**Acceptance Criteria**:

1. WHEN a PLAY event is processed THEN the system SHALL create or update `AnalyticsUserWatchHistory` for `(userId, contentId)`, incrementing `watchCount` for new sessions
2. WHEN a STOP event is processed THEN the system SHALL update `lastWatchedPositionMs`, recalculate `completionPercentage`, and accumulate `totalWatchTimeMs`
3. WHEN a COMPLETE event is processed THEN the system SHALL set `completed = true` and set `completionPercentage` to the computed value (capped when >= 90%)
4. WHEN a user watches content for the first time THEN `firstWatchedAt` SHALL be set and `watchCount` SHALL be 1
5. WHEN a user re-watches content in a new session THEN `watchCount` SHALL increment and `lastWatchedAt` SHALL update

**Independent Test**: Send PLAY → heartbeats → STOP events, then query `AnalyticsUserWatchHistory` and verify position and completion percentage.

---

### P1: Compute Content Performance Metrics ⭐ MVP

**User Story**: As the system, I want to aggregate per-content metrics so that admins can understand how content performs and other modules can use this data.

**Why P1**: Content performance is the foundation for admin dashboard and trending — must exist before those features.

**Acceptance Criteria**:

1. WHEN a PLAY event is processed THEN the system SHALL increment `totalViews` in `AnalyticsContentPerformance` (deduplicated by session)
2. WHEN a PLAY event is processed for a new user THEN `uniqueViewers` SHALL increment
3. WHEN a COMPLETE event is processed THEN `completionCount` SHALL increment
4. WHEN any relevant event is processed THEN `totalWatchTimeMs` and `avgCompletionPercentage` SHALL be recalculated
5. WHEN no performance record exists for a contentId THEN the system SHALL create one

**Independent Test**: Send PLAY and COMPLETE events from 3 different users, verify `totalViews`, `uniqueViewers`, and `completionCount` values.

---

### P1: Public API Facade — Watch History & Resume ⭐ MVP

**User Story**: As another module (catalog, recommendations), I want to query a user's watch history and resume position via a typed interface so that I can power "Continue Watching" and recommendation features.

**Why P1**: The facade is the integration contract — other modules depend on it.

**Acceptance Criteria**:

1. WHEN `getUserWatchHistory(userId)` is called THEN the system SHALL return the user's watch history sorted by `lastWatchedAt` descending
2. WHEN `getUserWatchHistory(userId, { completedOnly: true })` is called THEN the system SHALL return only completed entries
3. WHEN `getUserWatchHistory(userId, { limit: 10 })` is called THEN the system SHALL return at most 10 entries
4. WHEN `getUserResumePosition(userId, contentId)` is called for partially watched content THEN the system SHALL return `{ positionMs, completionPercentage }`
5. WHEN `getUserResumePosition(userId, contentId)` is called for unwatched content THEN the system SHALL return `null`

**Independent Test**: Populate watch history, call facade methods, verify correct data is returned.

---

### P2: Admin Content Performance Dashboard

**User Story**: As an admin, I want to view content performance metrics so that I can identify top and underperforming content.

**Why P2**: High value but depends on P1 aggregation being in place.

**Acceptance Criteria**:

1. WHEN an admin calls `GET /analytics/admin/content-performance` THEN the system SHALL return paginated content performance metrics with `page`, `limit`, `sortBy`, `sortOrder` support
2. WHEN an admin calls `GET /analytics/admin/content-performance/:contentId` THEN the system SHALL return detailed metrics for that content including computed fields (`completionRate`, `avgWatchTimeMs`)
3. WHEN an admin calls `GET /analytics/admin/content-performance/top?metric=totalViews&limit=10` THEN the system SHALL return the top 10 content items sorted by views descending
4. WHEN an admin calls `GET /analytics/admin/content-performance/bottom?metric=avgCompletionPercentage&limit=10` THEN the system SHALL return the bottom 10 by completion
5. WHEN a non-admin user calls any admin endpoint THEN the system SHALL return `403 Forbidden`

**Independent Test**: Seed content performance data, call each endpoint with various params, verify pagination, sorting, and filtering work correctly.

---

### P2: Admin User Engagement Reports

**User Story**: As an admin, I want to view user engagement metrics across the platform so that I can understand overall viewing behaviour and drill into specific users.

**Why P2**: Valuable reporting but depends on watch history aggregation (P1).

**Acceptance Criteria**:

1. WHEN an admin calls `GET /analytics/admin/user-engagement` THEN the system SHALL return a summary with `totalActiveUsers`, `totalViewingSessions`, `totalWatchTimeMs`, `avgSessionDurationMs`, `avgCompletionPercentage`, `totalBingeSessions`
2. WHEN an admin calls `GET /analytics/admin/user-engagement?granularity=DAILY` THEN the response SHALL include a `timeSeries` array with daily buckets containing `activeUsers`, `viewingSessions`, `watchTimeMs`
3. WHEN an admin calls `GET /analytics/admin/user-engagement/:userId` THEN the system SHALL return per-user detail including `topGenres`, `recentHistory`, and aggregate metrics
4. WHEN time-range params `from` and `to` are provided THEN the system SHALL filter all data to that window

**Independent Test**: Seed events from multiple users, call engagement endpoints with different granularities and time ranges, verify aggregated numbers.

---

### P2: Time-Range Filtering on Admin Endpoints

**User Story**: As an admin, I want to filter all dashboard metrics by date range so that I can analyse specific time periods.

**Why P2**: Essential for making the dashboard useful, but the core endpoints must exist first.

**Acceptance Criteria**:

1. WHEN `from` and `to` ISO 8601 query params are provided THEN the system SHALL filter raw events by `occurredAt` within that range before computing metrics
2. WHEN only `from` is provided THEN the system SHALL filter from that date to now
3. WHEN only `to` is provided THEN the system SHALL filter from the earliest event to that date
4. WHEN neither is provided THEN the system SHALL return all-time metrics
5. WHEN invalid date formats are provided THEN the system SHALL return `400 Bad Request`

**Independent Test**: Seed events across 3 different days, query with `from`/`to` that covers only 1 day, verify only that day's data is returned.

---

### P2: Trending Content Computation

**User Story**: As the system, I want to compute time-windowed trending scores so that the platform can highlight what's popular right now.

**Why P2**: Depends on content performance data (P1) and is consumed by the admin dashboard and public API.

**Acceptance Criteria**:

1. WHEN the daily trending scheduled job runs THEN the system SHALL compute trending scores for all content with views in the last 24 hours using the formula `(viewCount * 0.4) + (uniqueViewers * 0.4) + (avgCompletionPercentage * 0.2)`
2. WHEN the weekly trending scheduled job runs THEN the system SHALL compute scores for the last 7 days
3. WHEN trending scores are computed THEN content SHALL be ranked by score descending and stored in `AnalyticsTrendingContent`
4. WHEN an admin calls `GET /analytics/admin/trending?windowType=DAILY` THEN the system SHALL return the latest daily trending list

**Independent Test**: Seed view events for multiple content items with varying engagement, trigger trending computation, verify rankings match expected score ordering.

---

### P2: CSV Export

**User Story**: As an admin, I want to export analytics reports as CSV files so that I can analyse data in external tools.

**Why P2**: Useful for admins but depends on the reporting endpoints being built.

**Acceptance Criteria**:

1. WHEN an admin calls `GET /analytics/admin/export/content-performance` THEN the system SHALL return a CSV file with `Content-Type: text/csv` and `Content-Disposition: attachment` header
2. WHEN an admin calls `GET /analytics/admin/export/user-engagement` THEN the system SHALL return a CSV file of user engagement data
3. WHEN `from` and `to` params are provided THEN the exported data SHALL be filtered to that range
4. WHEN the dataset is large THEN the system SHALL stream the CSV response to avoid high memory usage

**Independent Test**: Seed data, call export endpoints, parse the CSV and verify it contains expected columns and rows.

---

### P3: Binge Session Detection

**User Story**: As the system, I want to detect when a user binge-watches a series so that this data can power engagement reports and future recommendations.

**Why P3**: Nice-to-have analytics insight; not critical for MVP or admin dashboard.

**Acceptance Criteria**:

1. WHEN a user completes 3+ episodes of the same series within a 4-hour gap threshold THEN the system SHALL create an `AnalyticsBingeSession` with `episodeCount`, `totalWatchTimeMs`, `startedAt`
2. WHEN a user completes another episode of an active binge session THEN the system SHALL increment `episodeCount` and update `totalWatchTimeMs`
3. WHEN the gap between episodes exceeds the threshold THEN the system SHALL close the binge session (set `endedAt`)
4. WHEN a user watches episodes of different series THEN each series SHALL have independent binge tracking

**Independent Test**: Simulate completing 4 episodes of the same series within 2 hours, verify binge session created with `episodeCount: 4`.

---

### P3: Genre Affinity Scoring

**User Story**: As the system, I want to compute per-user genre affinity scores so that recommendations can prioritise content from the user's preferred genres.

**Why P3**: Depends on content genre data from `@tlc/content`; most useful when the recommendations module is built.

**Acceptance Criteria**:

1. WHEN the scheduled genre affinity job runs THEN the system SHALL compute affinity scores for all users active in the last 30 days
2. WHEN computing a score THEN the system SHALL use the formula `(totalWatchTimeMs weight 0.7) + (contentCount weight 0.3)` normalised to 0–100
3. WHEN a user has watched content in multiple genres THEN each genre SHALL have its own `AnalyticsGenreAffinity` record
4. WHEN `getUserGenreAffinities(userId)` is called via the facade THEN the system SHALL return sorted affinities (highest score first)

**Independent Test**: Seed watch history across 3 genres with different watch times, trigger recomputation, verify scores reflect the 70/30 weighted formula.

---

### P3: Full Public API Facade

**User Story**: As another module, I want to query trending content, content performance, and genre affinities via the analytics facade so that I can build data-driven features without direct DB access.

**Why P3**: Extends the P1 facade; full value comes when consuming modules (recommendations, catalog) are built.

**Acceptance Criteria**:

1. WHEN `getTrendingContent('DAILY', 20)` is called THEN the system SHALL return the top 20 trending items for the daily window
2. WHEN `getContentPerformanceMetrics(contentId)` is called THEN the system SHALL return performance metrics or `null` if no data exists
3. WHEN `getUserGenreAffinities(userId)` is called THEN the system SHALL return the user's genre affinity scores

**Independent Test**: Populate all read models, call each facade method, verify correct data is returned.

---

## Edge Cases

- WHEN the player sends duplicate events (same `sessionId` + `eventType` + `occurredAt`) THEN the system SHALL persist both (append-only; deduplication is not required at the write layer)
- WHEN a heartbeat arrives for a session that has no corresponding PLAY event THEN the system SHALL persist the heartbeat anyway (eventual consistency)
- WHEN the BullMQ consumer fails to process an aggregation job THEN the system SHALL retry 3 times with exponential backoff before moving to the failed queue
- WHEN a scheduled job (trending, genre affinity) overlaps with a still-running previous job THEN BullMQ SHALL ensure only one instance runs at a time (concurrency: 1)
- WHEN the content's `durationMs` is 0 THEN the system SHALL set `completionPercentage` to 0 (avoid division by zero)
- WHEN admin endpoints are called with `limit > 100` THEN the system SHALL cap at 100
- WHEN no data exists for the requested time range THEN admin endpoints SHALL return empty results (not an error)

---

## Requirement Traceability

| Requirement ID | Story | Tasks | Phase | Status |
|---|---|---|---|---|
| ANLYT-01 | P1: Record Player Events | T4, T7, T8, T9, T10, T11 | In Tasks | Pending |
| ANLYT-02 | P1: Record Watch Progress Heartbeats | T4, T7, T9, T10, T11 | In Tasks | Pending |
| ANLYT-03 | P1: Compute User Watch History | T5, T12, T14, T15 | In Tasks | Pending |
| ANLYT-04 | P1: Compute Content Performance Metrics | T5, T13, T14, T15 | In Tasks | Pending |
| ANLYT-05 | P1: Public API Facade — Watch History & Resume | T16, T17, T18 | In Tasks | Pending |
| ANLYT-06 | P2: Admin Content Performance Dashboard | T19, T20, T21, T23, T24 | In Tasks | Pending |
| ANLYT-07 | P2: Admin User Engagement Reports | T19, T20, T21, T23, T24, T34 | In Tasks | Pending |
| ANLYT-08 | P2: Time-Range Filtering | T20, T21 | In Tasks | Pending |
| ANLYT-09 | P2: Trending Content Computation | T27, T28, T29, T30, T31 | In Tasks | Pending |
| ANLYT-10 | P2: CSV Export | T22, T23 | In Tasks | Pending |
| ANLYT-11 | P3: Binge Session Detection | T5, T32, T33, T34 | In Tasks | Pending |
| ANLYT-12 | P3: Genre Affinity Scoring | T5, T35, T36, T37 | In Tasks | Pending |
| ANLYT-13 | P3: Full Public API Facade | T31, T37 | In Tasks | Pending |

**Coverage:** 13 total, 13 mapped to tasks, 0 unmapped ✅

---

## Success Criteria

- [ ] All P1 acceptance criteria pass — events are captured, read models are computed, facade returns correct data
- [ ] All P2 acceptance criteria pass — admin dashboard returns paginated, filtered, sortable, exportable reports
- [ ] All P3 acceptance criteria pass — binge detection and genre affinity work correctly
- [ ] `nx build analytics` succeeds with no errors
- [ ] `nx lint:check analytics` succeeds with no warnings
- [ ] E2E tests cover all P1 and P2 stories with >90% of acceptance criteria verified
- [ ] Module follows all 10 architecture principles (entity prefixes, state isolation, lean controllers, facade exports only)
