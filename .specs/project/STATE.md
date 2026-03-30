# State

**Last Updated:** 2026-03-30T18:00:00Z
**Current Work:** core-personalization — COMPLETE. All 10 tasks implemented and gate checks passing.

---

## Recent Decisions (Last 60 days)

### AD-001: Batch computation over real-time personalization (2026-03-30)

**Decision:** Recommendations will be computed in daily batches, not updated in real-time as users browse.
**Reason:** Real-time personalization requires significant infrastructure (streaming pipeline, low-latency scoring). Daily batch is sufficient for v1 and aligns with the existing analytics computation model.
**Trade-off:** Recommendations can be up to 24h stale; a user who binge-watches 5 shows today won't see updated recs until tomorrow.
**Impact:** Simplifies architecture — recommendation scores can be pre-computed and stored, served as simple lookups at request time.

### AD-002: Content-based filtering only, no collaborative filtering (2026-03-30)

**Decision:** v1 uses content-based signals (genre affinity, viewing history, content metadata) only. No "users like you" collaborative filtering.
**Reason:** Collaborative filtering requires ML infrastructure, training pipelines, and sufficient user-item interaction volume. Content-based signals are available now from existing analytics and content modules.
**Trade-off:** Recommendation diversity may be lower — users get genre-biased suggestions rather than serendipitous cross-genre discoveries.
**Impact:** No ML dependencies. Recommendation logic is deterministic and debuggable.

### AD-003: Add genres to Content entity (content module prerequisite) (2026-03-30)

**Decision:** Add `genres: string[]` (jsonb) column to the Content entity in the content module + create a `ContentCatalogApi` shared interface for cross-module access.
**Reason:** Genres are intrinsic content metadata, not an analytics construct. Analytics currently gets genre data from client-provided `metadata.genres` on view events — this is fragile and not queryable. Every milestone (M1–M4) needs content-genre mapping. One-time investment.
**Trade-off:** Small scope expansion — requires content module migration + facade. Considered alternatives: (a) use analytics event metadata — fragile, client-dependent; (b) build genre index in recommendations — duplicates data, wrong ownership.
**Impact:** Unblocks B-002. Content module gets a proper catalog API. All future recommendation surfaces can query content by genre.

### AD-004: Self-populating pre-computed recommendations (2026-03-30)

**Decision:** Pre-computed recommendations are populated on first user access (cache miss → compute → store), then refreshed by a daily batch job that only processes known users.
**Reason:** Avoids needing a "list all users" API. Users self-register for recomputation by accessing the feature. Batch job scope is bounded to actual users.
**Trade-off:** First access is slightly slower (compute + store). Subsequent accesses are fast reads.
**Impact:** No modification to AnalyticsApi needed. Batch job is self-healing.

---

## Active Blockers

### ~~B-001: Analytics module facades not yet available~~ — RESOLVED

**Resolved:** 2026-03-30
**Resolution:** Facades are fully implemented. `AnalyticsApi` in `@tlc/shared-module/public-api` exposes `getUserGenreAffinities`, `getUserWatchHistory`, `getUserResumePosition`, `getTrendingContent`, `getContentPerformanceMetrics`. Implemented by `AnalyticsFacade`, exported from `AnalyticsModule`.

### ~~B-002: Content module has no genre/tag metadata~~ — RESOLVED (Design)

**Resolved:** 2026-03-30
**Resolution:** AD-003 — add `genres: string[]` column to Content entity + create `ContentCatalogApi` shared interface. Genre data is intrinsic to content, not analytics. Content module change is a prerequisite task in the core-personalization implementation.

---

## Lessons Learned

_(none yet)_

---

## Quick Tasks Completed

| #   | Description | Date | Commit | Status |
| --- | ----------- | ---- | ------ | ------ |

---

## Deferred Ideas

- [ ] Onboarding genre preference survey for cold-start users — Captured during: project init (PRD QA-04)
- [ ] Content availability filtering by region/plan — Captured during: project init (PRD QA-05)
- [ ] Completed content re-surfacing after 90 days — Captured during: project init (PRD QA-02)
- [ ] Editorial boost as additive signal vs. override — Captured during: project init (PRD QA-03)

---

## Todos

- [ ] Resolve PRD open questions (QA-01 through QA-05) with Product before starting M1
- [x] Verify analytics module facade contracts — completed 2026-03-30. All 5 methods available via `AnalyticsApi`. Note: PRD says `getViewingHistory` but actual method is `getUserWatchHistory`.
- [x] Run brownfield mapping on the existing codebase — completed 2026-03-30 (7 docs in `.specs/codebase/`)

---

## Preferences

**Model Guidance Shown:** never
