# Content Module Refactoring Specification

## Problem Statement

The `@tlc/content` module follows a subdomain-based pattern (admin, catalog, video-processor) but has accumulated architectural violations: a monolithic shared persistence layer, missing entity name prefixes, cross-subdomain direct repository access, a non-domain subdomain name ("admin"), missing transactions, a fat controller, and a functional bug (unregistered queue consumer). These issues put the module at **Developing maturity (59.7/100)** and need to be addressed to maintain architectural integrity.

## Goals

- [ ] Reach **Mature** maturity level (66+/100) by fixing all P0 and P1 violations
- [ ] Enforce subdomain ownership of persistence (no monolithic shared kernel)
- [ ] Ensure all entity names are module-prefixed to prevent cross-module table collisions
- [ ] Make cross-subdomain communication explicit via facades

## Out of Scope

| Feature | Reason |
| --- | --- |
| Health checks and metrics (P3) | Important but not blocking maturity; separate effort |
| Splitting catalog into its own module | Too thin currently; revisit when it grows |
| Migrating to CQRS within content | Over-engineering for current scale |
| Changing queue infrastructure | BullMQ setup is correct and working |

---

## User Stories

### P1: Fix Functional Bug — Consumer Registration ⭐ MVP

**User Story**: As a platform operator, I want the content age recommendation pipeline to work end-to-end so that content gets age ratings after video processing completes.

**Why P1**: The `ContentAgeRecommendationConsumer` is never registered — jobs in the `CONTENT_AGE_RECOMMENDATION` queue are silently dropped. This is a production bug.

**Acceptance Criteria**:

1. WHEN video-processor produces a `CONTENT_AGE_RECOMMENDATION` job THEN admin SHALL consume it and update the content's age recommendation
2. WHEN `ContentAdminModule` is loaded THEN `ContentAgeRecommendationConsumer` SHALL be registered as a provider
3. WHEN checking providers THEN duplicate `CreateMovieUseCase` and `CreateTvShowEpisodeUseCase` registrations SHALL be removed

**Independent Test**: Run e2e tests — age recommendation pipeline completes without errors.

---

### P1: Rename "admin" to "management" ⭐ MVP

**User Story**: As a developer, I want subdomain names to reflect domain concepts so that I can understand module responsibilities without guessing.

**Why P1**: "Admin" describes a role, not a domain. Every module could have an admin subdomain.

**Acceptance Criteria**:

1. WHEN navigating the codebase THEN the subdomain SHALL be named `management` (folder, module class, all imports)
2. WHEN importing from the subdomain THEN paths SHALL use `management/` not `admin/`
3. WHEN the module loads THEN all providers, controllers, and consumers SHALL resolve correctly

**Independent Test**: `nx build content` and `nx lint:check content` pass. E2e tests pass.

---

### P1: Module-Prefix All Entity Names ⭐ MVP

**User Story**: As a platform architect, I want all content entity table names prefixed with "Content" so that no other module can accidentally create a table name collision.

**Why P1**: Critical state isolation violation — 5 entities with generic names (`Content`, `Video`, `Episode`, `VideoMetadata`, `Thumbnail`).

**Acceptance Criteria**:

1. WHEN inspecting entity decorators THEN all `@Entity` names SHALL use `Content` prefix: `ContentItem`, `ContentVideo`, `ContentEpisode`, `ContentVideoMetadata`, `ContentThumbnail`
2. WHEN running `nx db:generate content` THEN a migration SHALL be created that renames the tables
3. WHEN running `nx db:migrate content` THEN the migration SHALL execute without errors
4. WHEN running e2e tests THEN all tests SHALL pass with the new table names

**Independent Test**: `nx db:migrate content` succeeds. E2e tests pass.

---

### P1: Dissolve Monolithic Shared Persistence

**User Story**: As a developer, I want each subdomain to own its repositories so that ownership boundaries are structurally enforced.

**Why P1**: The shared persistence module registers and exports all 4 repositories for all subdomains — the shared kernel anti-pattern.

**Acceptance Criteria**:

1. WHEN inspecting `ContentSharedPersistenceModule` THEN it SHALL have zero repository providers and zero repository exports — infrastructure (TypeORM connection) only
2. WHEN inspecting `ContentManagementModule` THEN it SHALL register `ContentRepository` and `EpisodeRepository` as its own providers
3. WHEN inspecting `ContentVideoProcessorModule` THEN it SHALL register `VideoRepository` and `VideoMetadataRepository` as its own providers
4. WHEN catalog needs Video data THEN it SHALL import `ContentVideoProcessorModule` and use `VideoReadFacade` — never inject repos directly
5. WHEN inspecting `ContentVideoProcessorModule` THEN it SHALL export only `VideoReadFacade`

**Independent Test**: `nx build content` passes. E2e tests pass. No cross-subdomain repository injection.

---

### P1: Add Missing Transactions

**User Story**: As a developer, I want all write operations wrapped in transactions so that data consistency is guaranteed.

**Why P1**: 4 use cases perform writes without `@Transactional` or `runInTransaction`.

**Acceptance Criteria**:

1. WHEN `CreateTvShowUseCase.execute()` saves content THEN it SHALL run inside `runInTransaction({ connectionName: 'content' })`
2. WHEN `SetAgeRecommendationForContentUseCase.execute()` saves content THEN it SHALL run inside `runInTransaction({ connectionName: 'content' })`
3. WHEN `GenerateSummaryForVideoUseCase.generateSummary()` saves metadata THEN it SHALL run inside `runInTransaction({ connectionName: 'content' })`
4. WHEN `TranscribeVideoUseCase.generateTranscript()` saves metadata THEN it SHALL run inside `runInTransaction({ connectionName: 'content' })`

**Independent Test**: E2e tests pass. Write operations are atomic.

---

### P2: Extract MediaPlayerController Streaming Logic

**User Story**: As a developer, I want controller methods to be lean so that HTTP concerns are separated from infrastructure logic.

**Why P2**: `MediaPlayerController.streamVideo()` has 30 lines of file-system streaming logic.

**Acceptance Criteria**:

1. WHEN streaming a video THEN the controller SHALL delegate to a `VideoStreamingService`
2. WHEN inspecting the controller method THEN it SHALL be under 20 lines
3. WHEN the service handles range requests THEN it SHALL support partial content (206) and full content (200)

**Independent Test**: E2e video streaming test passes.

---

### P2: Abstract ExternalMovieRatingClient Behind an Interface

**User Story**: As a developer, I want external API clients behind interfaces so that providers can be swapped without touching use cases.

**Why P2**: `ExternalMovieRatingClient` is directly injected — inconsistent with video-processor's adapter pattern.

**Acceptance Criteria**:

1. WHEN injecting the rating client THEN use cases SHALL depend on `ExternalMovieRatingAdapter` interface, not the concrete client
2. WHEN the module wires providers THEN it SHALL bind the interface to the concrete implementation

**Independent Test**: Build passes. Existing e2e tests pass.

---

### P2: Define Queue Contract Types

**User Story**: As a developer, I want queue payload types defined in `shared/contract/` so that producers and consumers share a single source of truth.

**Why P2**: Queue payload types are currently inline in consumers and producers.

**Acceptance Criteria**:

1. WHEN a producer creates a job payload THEN it SHALL use a contract type from `shared/contract/`
2. WHEN a consumer reads a job payload THEN it SHALL use the same contract type
3. WHEN inspecting `shared/contract/` THEN all queue payload interfaces SHALL be defined there

**Independent Test**: Build passes. Type-safety enforced.

---

## Edge Cases

- WHEN renaming entity tables THEN existing data in the database SHALL be preserved via `ALTER TABLE RENAME`
- WHEN renaming `admin/` to `management/` THEN e2e test imports and factory paths SHALL be updated
- WHEN moving repos to subdomains THEN `ContentVideoProcessorModule` importing `ContentSharedPersistenceModule` (for the TypeORM connection) SHALL still work

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| CONT-01 | P1: Fix Consumer Registration Bug | Pending |
| CONT-02 | P1: Rename admin → management | Pending |
| CONT-03 | P1: Module-Prefix Entity Names | Pending |
| CONT-04 | P1: Dissolve Shared Persistence | Pending |
| CONT-05 | P1: Add Missing Transactions | Pending |
| CONT-06 | P2: Extract Streaming Logic | Pending |
| CONT-07 | P2: Abstract Rating Client | Pending |
| CONT-08 | P2: Queue Contract Types | Pending |

**Coverage**: 8 total, 8 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] `nx build content` passes with zero errors
- [ ] `nx lint:check content` passes with zero errors
- [ ] `yarn test:e2e content` passes — all existing e2e tests work
- [ ] All entity names are module-prefixed (grep verification)
- [ ] Shared persistence module has zero repository providers/exports
- [ ] No cross-subdomain direct repository imports (grep verification)
- [ ] Maturity score improves to 66+ (Mature level)
