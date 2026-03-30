# Fakeflix Recommendations

**Vision:** Build a personalization layer that recommends content tailored to each user's viewing history and genre preferences, replacing the current generic catalog experience — reducing time-to-play, increasing discovery, and improving session depth.

**For:** Fakeflix end users (casual browsers, power users) and content managers (editorial team).

**Solves:** Users spend 4–7 minutes browsing before playing anything, and 23% of sessions end without a single play event. There is no personalization — every user sees the exact same catalog. This is a direct churn signal and the highest-leverage product gap to close this quarter.

## Goals

- **Reduce time-to-play** from 4–7 min average to < 2 min
- **Increase recommendation-originated plays** to > 40% of all play events by end of quarter
- **Improve session depth** (sessions with > 1 play) from 31% to > 45%
- **Enable editorial boosting** — content managers can pin/promote titles on recommendation surfaces
- **Surface hidden gems** — high completion-rate, low-view content gets organic visibility

## Tech Stack

**Core:**

- Framework: NestJS 10
- Language: TypeScript 5.9
- Database: PostgreSQL 15 (TypeORM)
- Monorepo: Nx 22 + Yarn workspaces

**Key dependencies:** BullMQ (async jobs), Redis 7 (cache/queues), Zod (validation), Winston (logging), class-validator/class-transformer (DTOs)

**Existing packages:** `analytics` (genre affinities, viewing history, trending), `content` (catalog metadata, genres, tags), `identity` (auth, user context), `billing`, `shared`

## Scope

**v1 includes:**

- Personalized "Recommended for You" row (genre affinity + viewing history)
- "Continue Watching" row (partially viewed content, resume from last position)
- "Trending Now" row (platform-wide popularity signal)
- "Top in [Genre]" rows (per-genre ranking by completion rate + views)
- "New Releases" row (recent additions filtered by user genre affinity)
- "Because You Watched [X]" row (content similarity — shared genres, tags, cast)
- Editorial Boost admin API (pin/promote titles on surfaces with expiration)
- "Hidden Gems" row (high completion + low views, weighted by user affinity)
- Recommendation effectiveness tracking (impression → click → conversion funnel)

**Explicitly out of scope:**

- Real-time personalization (batch computation is sufficient for v1)
- Collaborative filtering / ML infrastructure (deferred to v2)
- Social recommendations (no social graph exists)
- Email / push notification recommendations (separate channel)
- Explainability labels ("Because you watched X") — planned for v1.1
- Parental controls filtering (profiles module doesn't exist yet)
- A/B testing of recommendation strategies (separate experimentation module)

## Constraints

- **Dependencies:** P0 stories depend on `analytics` module facades (`getUserGenreAffinities`, `getViewingHistory`, `getTrendingContent`) which are in progress
- **Computation model:** Batch (daily recomputation), not real-time — accepted trade-off for v1
- **Cold start:** New users with no viewing history fall back to trending content
- **Data availability:** `content` module metadata (genres, tags) is available; `identity` auth is available
