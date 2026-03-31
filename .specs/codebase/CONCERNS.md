# Concerns

## Missing Auth Guards on Management Controllers

**Severity:** High — admin endpoints accessible without authentication.
**Location:** `package/content/management/http/rest/controller/management-movie.controller.ts`, `package/content/management/http/rest/controller/management-tv-show.controller.ts`
**Evidence:** `ManagementMovieController` and `ManagementTvShowController` have no `@UseGuards(AuthGuard, AdminGuard)` at class or method level, exposing CRUD operations on content to any unauthenticated caller.
**Impact:** Any actor can create, update, or delete content without a valid admin JWT.
**Fix approach:** Add `@UseGuards(AuthGuard, AdminGuard)` at class level on both controllers, following the pattern now used by `ContentLifecycleController` and `PipelineDashboardController`.

## Content Catalog Returns All Content (No Filtering)

**Severity:** High — directly related to the content-lifecycle PRD.
**Location:** `package/content/catalog/persistence/repository/catalog-content.repository.ts`, `package/content/catalog/core/use-case/list-catalog-content.use-case.ts`
**Evidence:** `CatalogContentRepository.findAll()` returns all `ContentItem` rows with no status filter. `ListCatalogContentUseCase` maps results without any filtering.
**Impact:** Content is visible the moment it's created — no draft/review/published distinction.
**Fix approach:** Add `publishingStatus` column to `Content` entity, filter by `PUBLISHED` in `CatalogContentRepository.findAll()` and facade.

## No publishingStatus in Content Entity

**Severity:** High — foundational gap for the content lifecycle feature.
**Location:** `package/content/shared/persistence/entity/content.entity.ts`
**Evidence:** Entity has `type`, `title`, `description`, `ageRecommendation`, `releaseDate`, `genres` — no `publishingStatus` or related state fields.
**Impact:** Impossible to implement draft/review/publish/archive workflow without schema migration.
**Fix approach:** Add `publishingStatus` column (enum), default to `DRAFT` for new content, migration to set `PUBLISHED` for all existing rows.

## PRD vs Code Discrepancy

**Severity:** Medium — PRD describes catalog as "returns `[]`" but it actually returns data.
**Location:** `docs/content-lifecycle-prd.md` (line about `ListContentUseCase` returning `[]`)
**Evidence:** `ListCatalogContentUseCase` is implemented and returns real data from DB.
**Impact:** PRD assumptions about current behavior are partially incorrect — implementation is more advanced than described.
**Fix approach:** No code fix needed — note this discrepancy during planning.

## Stub GraphQL Resolver (Videos)

**Severity:** Low — not blocking for lifecycle feature.
**Location:** `package/content/catalog/http/graphql/resolver/video.resolver.ts`
**Evidence:** `listVideos()` returns hardcoded `[{ name: 'video1' }, { name: 'video2' }]` with TODO comment.
**Impact:** GraphQL API has a non-functional endpoint.
**Fix approach:** Implement or remove. Not related to lifecycle feature.

## No Unit Tests for Content Catalog

**Severity:** Medium — relevant to lifecycle feature development.
**Location:** `package/content/catalog/`
**Evidence:** Only e2e tests exist (`list-content.spec.ts`, `video-player.spec.ts`, `content-catalog-facade.spec.ts`). No unit tests for use cases.
**Impact:** Adding state machine logic will need e2e tests — no existing unit test patterns to follow in this subdomain.
**Fix approach:** E2E tests are the established pattern for catalog; follow it consistently.

## Multiple TODO Comments in Billing

**Severity:** Low — not related to content lifecycle.
**Location:** `package/billing/` (multiple files)
**Evidence:** TODOs for payment processing randomness, config, event emission.
**Impact:** Billing module has known incomplete areas.

## Postgres Version Skew (Docker vs CI)

**Severity:** Low — unlikely to cause issues for this feature.
**Location:** `docker-compose.yml` (postgres:15-alpine) vs `.github/workflows/main.yml` (postgres:14)
**Evidence:** Different major versions between local and CI environments.
**Impact:** Potential edge case differences in SQL behavior.
**Fix approach:** Align versions.

## Unused AWS SDK Dependencies

**Severity:** Low.
**Location:** Root `package.json`
**Evidence:** `@aws-sdk/client-dynamodb` and `aws-sdk` listed but no TypeScript imports found.
**Impact:** Bloated dependencies.
**Fix approach:** Remove if confirmed unused.
