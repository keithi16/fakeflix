# Content Module Refactoring Tasks

**Spec**: `.specs/features/content-module-refactoring/spec.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Bug Fix (Sequential)

```
T1
```

### Phase 2: Rename Subdomain (Sequential)

```
T2 → T3
```

### Phase 3: State Isolation (Sequential)

```
T4 → T5
```

### Phase 4: Persistence Restructuring (Sequential)

```
T6 → T7 → T8 → T9
```

### Phase 5: Code Quality (Parallel OK)

```
     ┌→ T10 ─┐
T9 ──┼→ T11 ─┼──→ T14
     ├→ T12 ─┘
     └→ T13 ─┘
```

### Phase 6: Verification (Sequential)

```
T14 → T15
```

---

## Task Breakdown

### T1: Fix ContentAgeRecommendationConsumer Registration and Remove Duplicate Providers

**What**: Register `ContentAgeRecommendationConsumer` in the admin module providers and remove duplicate `CreateMovieUseCase` / `CreateTvShowEpisodeUseCase` entries.
**Where**: `package/content/admin/content-admin.module.ts`
**Depends on**: None
**Requirement**: CONT-01

**Done when**:

- [ ] `ContentAgeRecommendationConsumer` is added to `ContentAdminModule` providers
- [ ] Duplicate `CreateMovieUseCase` entry removed (appears twice)
- [ ] Duplicate `CreateTvShowEpisodeUseCase` entry removed (appears twice)
- [ ] Build passes: `nx build content`

**Verify**:

```bash
nx build content
# Grep for the consumer in the module file
rg "ContentAgeRecommendationConsumer" package/content/admin/content-admin.module.ts
```

**Commit**: `fix(content): register ContentAgeRecommendationConsumer and remove duplicate providers`

---

### T2: Rename admin/ Directory to management/

**What**: Rename the `admin/` subdomain directory to `management/` and update all file/class/module names from "Admin" to "Management".
**Where**: `package/content/admin/` → `package/content/management/`
**Depends on**: T1
**Requirement**: CONT-02

Files to rename/update:
- Directory: `admin/` → `management/`
- `content-admin.module.ts` → `content-management.module.ts`
- Class: `ContentAdminModule` → `ContentManagementModule`
- Controllers: `AdminMovieController` → `ManagementMovieController`, `AdminTvShowController` → `ManagementTvShowController`
- E2e test directory: `__test__/e2e/admin/` → `__test__/e2e/management/`

**Done when**:

- [ ] `admin/` directory no longer exists
- [ ] `management/` directory contains all former admin files
- [ ] All class names updated: `ContentAdminModule` → `ContentManagementModule`, `AdminMovieController` → `ManagementMovieController`, `AdminTvShowController` → `ManagementTvShowController`
- [ ] All imports throughout the content package updated
- [ ] No references to `admin/` remain in content package imports (except HTTP route paths — those stay as `admin/movie` and `admin/tv-show` since they're API paths, not domain names)

**Verify**:

```bash
# No imports referencing old admin path
rg "from.*['\"].*\/admin\/" package/content/ --glob '!__test__/**'
# Build
nx build content
```

**Commit**: `refactor(content): rename admin subdomain to management`

---

### T3: Update E2e Tests and Factories for Renamed Subdomain

**What**: Update e2e test files, test helpers, and factory imports to reference `management/` instead of `admin/`.
**Where**: `package/content/__test__/`, `package/content/management/__test__/`
**Depends on**: T2
**Requirement**: CONT-02

**Done when**:

- [ ] E2e test files in `management/__test__/e2e/` reference correct paths
- [ ] Test constants file updated if needed
- [ ] All test helpers and factories import from the correct paths
- [ ] E2e tests pass: `yarn test:e2e content`

**Verify**:

```bash
yarn test:e2e content
```

**Commit**: `refactor(content): update e2e tests for management rename`

---

### T4: Add Module Prefix to All Entity Names

**What**: Update all 5 entity `@Entity` decorators to use `Content`-prefixed table names.
**Where**: `package/content/shared/persistence/entity/*.entity.ts`
**Depends on**: T3
**Requirement**: CONT-03

Name mapping:
- `@Entity({ name: 'Content' })` → `@Entity({ name: 'ContentItem' })`
- `@Entity({ name: 'Video' })` → `@Entity({ name: 'ContentVideo' })`
- `@Entity('Episode')` → `@Entity({ name: 'ContentEpisode' })`
- `@Entity({ name: 'VideoMetadata' })` → `@Entity({ name: 'ContentVideoMetadata' })`
- `@Entity({ name: 'Thumbnail' })` → `@Entity({ name: 'ContentThumbnail' })`

**Done when**:

- [ ] All 5 entity decorators use `Content`-prefixed names
- [ ] No unprefixed entity names remain in content package
- [ ] Build passes: `nx build content`

**Verify**:

```bash
rg "@Entity.*name:" package/content/shared/persistence/entity/
# Each line should show Content-prefixed names
nx build content
```

**Commit**: `refactor(content): add module prefix to all entity table names`

---

### T5: Generate and Validate Migration for Entity Renames

**What**: Generate a TypeORM migration that renames the 5 tables and verify it runs correctly.
**Where**: `package/content/shared/persistence/migration/`
**Depends on**: T4
**Requirement**: CONT-03

**Done when**:

- [ ] Migration generated: `nx db:generate content`
- [ ] Migration contains `ALTER TABLE ... RENAME TO` statements (not DROP+CREATE)
- [ ] Migration runs successfully: `nx db:migrate content`
- [ ] E2e tests pass with new table names: `yarn test:e2e content`

**Verify**:

```bash
nx db:generate content
# Inspect the generated migration file for RENAME statements
nx db:migrate content
yarn test:e2e content
```

**Commit**: `chore(content): add migration for entity table rename`

---

### T6: Move Entities to Owning Subdomains

**What**: Move entity files from `shared/persistence/entity/` to their owning subdomain's `persistence/entity/` directory. Video entity stays in shared (genuinely co-owned).
**Where**: Multiple directories
**Depends on**: T5
**Requirement**: CONT-04

Entity ownership:
- `content.entity.ts` (Content, MovieContent, TvShowContent) → `management/persistence/entity/`
- `episode.entity.ts` → `management/persistence/entity/`
- `thumbnail.entity.ts` → `management/persistence/entity/`
- `video-metadata.entity.ts` → `video-processor/persistence/entity/`
- `video.entity.ts` → stays in `shared/persistence/entity/` (genuinely shared — cascade-written by management, read by video-processor and catalog)

**Done when**:

- [ ] `management/persistence/entity/` contains `content.entity.ts`, `episode.entity.ts`, `thumbnail.entity.ts`
- [ ] `video-processor/persistence/entity/` contains `video-metadata.entity.ts`
- [ ] `shared/persistence/entity/` contains only `video.entity.ts`
- [ ] All imports across the package updated to new paths
- [ ] TypeORM datasource factory entity glob updated to scan all subdomain entity directories
- [ ] Build passes: `nx build content`

**Verify**:

```bash
ls package/content/management/persistence/entity/
ls package/content/video-processor/persistence/entity/
ls package/content/shared/persistence/entity/
nx build content
```

**Commit**: `refactor(content): move entities to owning subdomains`

---

### T7: Strip Repositories from Shared Persistence Module

**What**: Remove all repository providers and exports from `ContentSharedPersistenceModule`. It becomes infrastructure-only (TypeORM connection).
**Where**: `package/content/shared/persistence/persistence.module.ts`
**Depends on**: T6
**Requirement**: CONT-04

**Done when**:

- [ ] `ContentSharedPersistenceModule` has zero `providers` entries for repositories
- [ ] `ContentSharedPersistenceModule` has zero `exports` entries for repositories
- [ ] Module still exports the TypeORM connection (via `TypeOrmPersistenceModule` import)
- [ ] No imports from `admin/persistence/repository/` or `video-processor/persistence/repository/` in the shared module

**Verify**:

```bash
rg "Repository" package/content/shared/persistence/persistence.module.ts
# Should return zero matches
```

**Commit**: `refactor(content): make shared persistence infrastructure-only`

---

### T8: Register Repositories in Owning Subdomain Modules

**What**: Each subdomain module registers its own repositories as providers.
**Where**: `package/content/management/content-management.module.ts`, `package/content/video-processor/content-video-processor.module.ts`
**Depends on**: T7
**Requirement**: CONT-04

Management module registers:
- `ContentRepository`
- `EpisodeRepository`

Video-processor module registers (already has them, just ensure no duplication):
- `VideoRepository`
- `VideoMetadataRepository`

**Done when**:

- [ ] `ContentManagementModule` lists `ContentRepository` and `EpisodeRepository` in `providers`
- [ ] `ContentVideoProcessorModule` lists `VideoRepository` and `VideoMetadataRepository` in `providers` (remove if previously inherited from shared)
- [ ] `ContentVideoProcessorModule` removes the direct `ContentSharedPersistenceModule` import (it gets it through `ContentSharedModule`)
- [ ] Build passes: `nx build content`

**Verify**:

```bash
rg "ContentRepository|EpisodeRepository" package/content/management/content-management.module.ts
rg "VideoRepository|VideoMetadataRepository" package/content/video-processor/content-video-processor.module.ts
nx build content
```

**Commit**: `refactor(content): register repos in owning subdomain modules`

---

### T9: Create VideoReadFacade and Refactor Catalog

**What**: Create `VideoReadFacade` in video-processor's `public-api/facade/`, export it from the module, and refactor catalog's `GetStreamingURLUseCase` to use the facade instead of directly importing `VideoRepository`.
**Where**: `package/content/video-processor/public-api/facade/video-read.facade.ts` (new), `package/content/video-processor/content-video-processor.module.ts`, `package/content/catalog/content-catalog.module.ts`, `package/content/catalog/core/use-case/get-streaming-url.use-case.ts`
**Depends on**: T8
**Reuses**: Pattern from `package/analytics` internal facades
**Requirement**: CONT-04

**Done when**:

- [ ] `VideoReadFacade` exists at `video-processor/public-api/facade/video-read.facade.ts`
- [ ] Facade exposes `findVideoUrlById(videoId: string): Promise<string | null>` (pure delegation, no business logic)
- [ ] `ContentVideoProcessorModule` exports `VideoReadFacade` (and nothing else)
- [ ] `ContentCatalogModule` imports `ContentVideoProcessorModule`
- [ ] `GetStreamingURLUseCase` injects `VideoReadFacade` instead of `VideoRepository`
- [ ] No direct import from `video-processor/persistence/` in catalog
- [ ] Build passes: `nx build content`
- [ ] E2e video streaming test passes: `yarn test:e2e content`

**Verify**:

```bash
rg "from.*video-processor/persistence" package/content/catalog/
# Should return zero matches
nx build content
yarn test:e2e content
```

**Commit**: `refactor(content): add VideoReadFacade for cross-subdomain access`

---

### T10: Add Missing Transactions to Write Operations [P]

**What**: Wrap 4 use cases' write operations in `runInTransaction({ connectionName: 'content' })`.
**Where**: Multiple use case files
**Depends on**: T9
**Requirement**: CONT-05

Use cases to update:
1. `management/core/use-case/create-tv-show.use-case.ts` — wrap `contentRepository.saveTvShowContent()` in transaction
2. `management/core/use-case/set-age-recommendation-for-content.user-case.ts` — wrap `contentRepository.save()` in transaction
3. `video-processor/core/use-case/generate-summary-for-video.use-case.ts` — wrap `videoMetadataRepository.save()` calls in transaction
4. `video-processor/core/use-case/transcribe-video.use-case.ts` — wrap `videoMetadataRepository.save()` calls in transaction

**Done when**:

- [ ] All 4 use cases wrap writes in `runInTransaction({ connectionName: 'content' })`
- [ ] No `@Transactional()` without `connectionName` in content package
- [ ] Build passes: `nx build content`

**Verify**:

```bash
rg "runInTransaction|@Transactional" package/content/ --glob '*.ts'
# All occurrences should include connectionName: 'content'
nx build content
```

**Commit**: `fix(content): add missing transactions to write operations`

---

### T11: Extract Streaming Logic from MediaPlayerController [P]

**What**: Create `VideoStreamingService` in catalog and move file-system streaming logic out of the controller.
**Where**: `package/content/catalog/core/service/video-streaming.service.ts` (new), `package/content/catalog/http/rest/controller/media-player.controller.ts`
**Depends on**: T9
**Requirement**: CONT-06

**Done when**:

- [ ] `VideoStreamingService` exists with `streamVideo(videoId: string, range?: string): StreamResult` method
- [ ] Service handles range parsing, file stat, and stream creation
- [ ] Controller method is under 20 lines — only HTTP concerns (extract request, call service, set headers, pipe response)
- [ ] `VideoStreamingService` is registered in `ContentCatalogModule`
- [ ] No `fs` or `path` imports in the controller
- [ ] Build passes: `nx build content`
- [ ] E2e streaming test passes: `yarn test:e2e content`

**Verify**:

```bash
rg "import.*fs|import.*path" package/content/catalog/http/rest/controller/
# Should return zero matches
nx build content
yarn test:e2e content
```

**Commit**: `refactor(content): extract streaming logic into VideoStreamingService`

---

### T12: Abstract ExternalMovieRatingClient Behind an Interface [P]

**What**: Create `ExternalMovieRatingAdapter` interface (following the video-processor adapter pattern) and bind the concrete client to it in the module.
**Where**: `package/content/management/core/adapter/external-movie-rating.adapter.interface.ts` (new), `package/content/management/http/client/external-movie-rating/external-movie-rating.client.ts`, `package/content/management/core/use-case/create-movie.use-case.ts`, `package/content/management/content-management.module.ts`
**Depends on**: T9
**Requirement**: CONT-07

**Done when**:

- [ ] `ExternalMovieRatingAdapter` interface defined with `getRating(title: string): Promise<number | null>` and a Symbol token
- [ ] `ExternalMovieRatingClient` implements the interface
- [ ] `CreateMovieUseCase` injects via `@Inject(ExternalMovieRatingAdapter)` instead of concrete class
- [ ] Module uses `{ provide: ExternalMovieRatingAdapter, useClass: ExternalMovieRatingClient }`
- [ ] Build passes: `nx build content`

**Verify**:

```bash
rg "ExternalMovieRatingAdapter" package/content/management/
nx build content
```

**Commit**: `refactor(content): abstract ExternalMovieRatingClient behind adapter interface`

---

### T13: Define Queue Contract Types in shared/contract/ [P]

**What**: Create shared contract interfaces for all queue payloads and use them in producers and consumers.
**Where**: `package/content/shared/contract/` (new directory), multiple producer/consumer files
**Depends on**: T9
**Requirement**: CONT-08

Contracts to define:
- `VideoProcessingJobPayload` — `{ videoId: string; url: string }` (used by VIDEO_* queues)
- `ContentAgeRecommendationJobPayload` — `{ videoId: string; ageRecommendation: number }` (used by CONTENT_AGE_RECOMMENDATION queue)

**Done when**:

- [ ] `shared/contract/video-processing-job.contract.ts` exists with `VideoProcessingJobPayload`
- [ ] `shared/contract/content-age-recommendation-job.contract.ts` exists with `ContentAgeRecommendationJobPayload`
- [ ] All producers and consumers import payload types from `shared/contract/`
- [ ] No inline `Job<{ ... }>` type definitions in consumers
- [ ] Build passes: `nx build content`

**Verify**:

```bash
ls package/content/shared/contract/
rg "from.*shared/contract" package/content/
nx build content
```

**Commit**: `refactor(content): define queue contract types in shared/contract`

---

### T14: Build, Lint, and Fix Any Issues

**What**: Run full build and lint checks. Fix any issues introduced during refactoring.
**Where**: Entire content package
**Depends on**: T10, T11, T12, T13
**Requirement**: All

**Done when**:

- [ ] `nx build content` passes with zero errors
- [ ] `nx lint:check content` passes with zero errors
- [ ] No circular dependency warnings

**Verify**:

```bash
nx build content
nx lint:check content
```

**Commit**: `chore(content): fix lint and build issues from refactoring` (only if fixes needed)

---

### T15: Run E2e Tests and Verify Architecture

**What**: Run all e2e tests and perform architecture verification checks.
**Where**: Entire content package
**Depends on**: T14
**Requirement**: All

**Done when**:

- [ ] E2e tests pass: `yarn test:e2e content`
- [ ] No duplicate entity names: `rg "@Entity.*name:" package/content/ | rg -o "name: '[^']*'" | sort | uniq -d` returns empty
- [ ] No cross-subdomain direct repo imports: `rg "from.*\.\./\.\./\.\./(?!shared)" package/content/*/core/` returns empty
- [ ] Shared persistence has zero repos: `rg "Repository" package/content/shared/persistence/persistence.module.ts` returns empty
- [ ] All transactions have connectionName: `rg "@Transactional\(\)" package/content/` returns empty

**Verify**:

```bash
yarn test:e2e content
rg "@Entity.*name:" package/content/ --glob '*.entity.ts'
rg "Repository" package/content/shared/persistence/persistence.module.ts
```

**Commit**: No commit — verification only.

---

## Parallel Execution Map

```
Phase 1 (Bug Fix):
  T1

Phase 2 (Rename):
  T1 ──→ T2 ──→ T3

Phase 3 (State Isolation):
  T3 ──→ T4 ──→ T5

Phase 4 (Persistence Restructuring):
  T5 ──→ T6 ──→ T7 ──→ T8 ──→ T9

Phase 5 (Code Quality — Parallel):
  T9 complete, then:
    ├── T10 [P]  Add missing transactions
    ├── T11 [P]  Extract streaming logic
    ├── T12 [P]  Abstract rating client
    └── T13 [P]  Queue contract types

Phase 6 (Verification):
  T10, T11, T12, T13 complete, then:
    T14 ──→ T15
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Fix consumer registration | 1 file (module) | ✅ Granular |
| T2: Rename admin → management | ~20 files (rename + imports) | ⚠️ Large but atomic (single rename) |
| T3: Update e2e tests for rename | ~5 files (tests) | ✅ Granular |
| T4: Prefix entity names | 5 files (entities) | ✅ Granular |
| T5: Generate migration | 1 file (migration) | ✅ Granular |
| T6: Move entities to subdomains | ~10 files (move + imports) | ⚠️ Large but atomic (single restructure) |
| T7: Strip repos from shared | 1 file (module) | ✅ Granular |
| T8: Register repos in subdomains | 2 files (modules) | ✅ Granular |
| T9: Create facade + refactor catalog | 4 files | ✅ Granular |
| T10: Add missing transactions | 4 files (use cases) | ✅ Granular |
| T11: Extract streaming logic | 2 files (new service + controller) | ✅ Granular |
| T12: Abstract rating client | 4 files | ✅ Granular |
| T13: Queue contract types | ~8 files (new contracts + updates) | ✅ Granular |
| T14: Build and lint | 0 files (verification) | ✅ Granular |
| T15: E2e and architecture check | 0 files (verification) | ✅ Granular |
