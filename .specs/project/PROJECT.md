# Content Lifecycle & Publishing Pipeline

**Vision:** Transform Fakeflix content management from an atomic, immediate-publish model into a full editorial pipeline with draft/review/publish/archive states, quality gates, and scheduled publishing — ensuring the public catalog only ever displays complete, approved content.

**For:** Content management team (editors, quality analysts) and end users.

**Solves:** Accidental exposure of incomplete content, inability to schedule launches, destructive-only content removal, and zero visibility into editorial pipeline state.

## Goals

- Zero incomplete content visible in the public catalog (enforced by quality gates)
- Editorial team has full control over content visibility (draft → review → publish → archive flow)
- Scheduled publishing eliminates manual timing of launches
- Non-destructive archiving replaces database deletes, preserving all historical data
- Operational dashboard provides real-time pipeline visibility

## Tech Stack

**Core:** NestJS 10 / TypeScript 5.9 / PostgreSQL 15 / TypeORM 0.3

**Key dependencies:** BullMQ (scheduled jobs), class-validator (DTO validation), `@nestjs/event-emitter` (domain events), supertest + Jest (testing)

## Scope

**v1 includes:**

- Publishing state machine (DRAFT → REVIEW → PUBLISHED → ARCHIVED) with validated transitions
- Quality gates enforced before REVIEW → PUBLISHED (thumbnail, description, genre, age rating)
- Catalog filtering by publishingStatus (public APIs return only PUBLISHED)
- Scheduled publishing with automated gate verification
- Non-destructive content archiving with republication capability
- Pipeline summary dashboard (counts by state, recent transitions)
- Transition audit trail per content item
- Bulk state transitions (up to 50 items)

**Explicitly out of scope:**

- Multi-step approval workflows (editor → reviewer → director)
- Public preview links for unpublished content
- Regional availability / geo-restrictions
- Metadata versioning / edit history
- Automated notifications for stale content
- License-based auto-depublication
- Per-episode publishing granularity (v2)

## Constraints

- Backward compatibility: existing content must be migrated to PUBLISHED status
- Content database is shared across content submodains (catalog, management, media) — state machine must live in content/shared or management
- Cross-module filtering (recommendations, analytics) must be transparent via the existing facade pattern
- No new infrastructure dependencies beyond what exists (Postgres, Redis/BullMQ)
