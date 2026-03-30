# Roadmap

**Current Milestone:** M1 — Core Personalization
**Status:** Planning

---

## M1 — Core Personalization (P0)

**Goal:** Deliver the two highest-impact recommendation surfaces — personalized content and resume-watching — so users find relevant content immediately on the home screen.
**Target:** End of Sprint 2

### Features

**Personalized Row ("Recommended for You")** — PLANNED

- Compute personalized content scores using genre affinity weights from analytics
- Rank up to 20 unwatched titles per user, ordered by personalization score
- Fallback to trending content for new users (no viewing history)
- Exclude completed content (>= 90% watched)
- Recompute recommendations within 24h of new viewing events (daily batch)
- Support unauthenticated users with trending-only fallback

**Continue Watching Row** — PLANNED

- Surface partially viewed content (> 5% and < 90% complete), ordered by most recently watched
- Resume playback from last known position on click
- Auto-remove completed content (>= 90%)
- Cap at 20 items
- Support explicit dismiss (content does not reappear even if re-watched)

---

## M2 — Discovery Surfaces (P1)

**Goal:** Add genre-aware and trend-driven rows that make the home screen feel personalized and fresh, covering the primary discovery patterns.
**Target:** End of Sprint 4

### Features

**Trending Now Row** — PLANNED

- Display top 20 trending titles from daily analytics computation
- Refresh within 1h of trending recomputation
- Completed content still appears (social signal, not personal)
- Previous day's trending as fallback if today's computation hasn't run

**Top in [Genre] Rows** — PLANNED

- Up to 3 genre rows based on user's top genre affinities
- Ranked by composite of completion rate + view count within genre
- Exclude completed content
- Suppress genre row if fewer than 5 unwatched titles available
- Not shown for users without genre affinities

**New Releases Row (Genre-Filtered)** — PLANNED

- Content added in last 30 days, filtered by user's top 3 genre affinities
- Ordered by release date (newest first)
- Fallback to all genres for users without affinity data
- Suppress if fewer than 5 matching items
- Exclude completed content

---

## M3 — Advanced Personalization (P2)

**Goal:** Add content-similarity recommendations and editorial control, enabling deeper personalization and business-driven content promotion.
**Target:** End of Sprint 6

### Features

**"Because You Watched [X]" Row** — PLANNED

- Generate similarity-based row from user's most recently completed title
- Match by shared genres, similar completion rates, and common tags
- Exclude completed content
- Suppress if fewer than 5 similar titles
- Not shown for users who haven't completed any content

**Editorial Boost (Admin API)** — PLANNED

- `POST /recommendations/admin/boost` — mark content for elevated ranking on a surface
- Optional expiration (`expiresAt`) with automatic revert to organic ranking
- Boosted content appears in top 5 positions of target row
- `GET /recommendations/admin/boosts` — list active boosts with metadata
- `DELETE` boost support with organic revert on next recomputation cycle
- Admin-only access (403 for non-admin users)

---

## M4 — Insights & Niche Discovery (P3)

**Goal:** Surface high-quality niche content and provide analytics on recommendation effectiveness to close the feedback loop.
**Target:** End of Sprint 8

### Features

**Hidden Gems Row** — PLANNED

- Identify content with completionRate >= 70% and totalViews <= 500
- Display up to 10 items weighted by user's genre affinities
- Exclude completed content
- Suppress if fewer than 5 matching items

**Recommendation Effectiveness Tracking** — PLANNED

- Log impression events (userId, contentId, surface, rank) on recommendation click
- Log conversion events linking play to impression within 5-minute window
- `GET /recommendations/admin/effectiveness` — metrics per surface (impressions, clicks, conversions, CTR, conversion rate)
- Support date range filtering (`from`, `to`)

---

## Future Considerations

- Explainability labels ("Because you watched X") on recommendation rows — planned for v1.1
- Collaborative filtering ("users like you also watched") — requires ML infrastructure (v2)
- Real-time recommendation updates (as user browses) — infrastructure investment
- Onboarding genre preference survey for cold-start mitigation
- Content availability filtering by region/plan
- A/B testing framework for recommendation strategies
