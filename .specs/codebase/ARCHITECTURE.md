# Architecture

**Pattern:** NestJS Modular Monolith with per-domain database isolation

## High-Level Structure

Two deployable apps compose independent domain packages:

```
app/monolith → ContentModule + IdentityModule + AnalyticsModule + RecommendationsModule
app/billing-api → BillingModule (separate deployment)
```

Domain logic lives exclusively in `package/*`. Apps are thin bootstraps (config, global pipes, transactional context).

## Identified Patterns

### Modular Domain Packages

**Location:** `package/<domain>/`
**Purpose:** Each business domain is an independently structured NestJS module with its own database, persistence, and public API.
**Implementation:** Subdomains when needed (e.g., `content/management`, `content/catalog`, `content/media`, `content/shared`).

### Layer Structure per Subdomain

**Location:** `package/<domain>/<subdomain>/`
**Purpose:** Separation of concerns within each module.
**Implementation:**
- `core/service/` — Domain services
- `core/use-case/` — Application use cases (orchestration)
- `http/rest/controller/` — REST controllers (lean, no business logic)
- `http/graphql/resolver/` — GraphQL resolvers
- `http/client/` — External HTTP client wrappers
- `persistence/entity/` — TypeORM entities
- `persistence/repository/` — Repositories extending `DefaultTypeOrmRepository`
- `queue/producer/` and `queue/consumer/` — BullMQ job producers/consumers
- `public-api/facade/` — Cross-module facade implementations

### Cross-Module Communication (Facade + Token)

**Location:** `package/shared/module/public-api/interface/` (contracts), each domain's `public-api/facade/` (implementations)
**Purpose:** Explicit boundaries — modules never access each other's DB or repositories directly.
**Implementation:**
1. Interface + Symbol token defined in shared (e.g., `ContentCatalogApi`)
2. Facade class implements interface in owning module (e.g., `ContentCatalogFacade`)
3. Module registers `{ provide: ContentCatalogApi, useClass: ContentCatalogFacade }`
4. Consumers inject via `@Inject(ContentCatalogApi)` — zero coupling to internals
**Example:** `ContentCatalogFacade` → `ListCatalogContentUseCase` → `CatalogContentRepository`

### HTTP Cross-Service Communication

**Location:** `package/shared/module/public-api/http/client/`
**Purpose:** Out-of-process calls between separately deployed apps (monolith ↔ billing-api).
**Example:** `BillingSubscriptionHttpClient` calls billing-api's REST endpoint for subscription status.

### Repository Pattern (Composition over Inheritance)

**Location:** `package/shared/module/typeorm/repository/default-typeorm.repository.ts`
**Purpose:** Encapsulate TypeORM — only expose `save`, `findOne`, `find`, `exists`.
**Implementation:** All repos extend `DefaultTypeOrmRepository<Entity>`, inject named DataSource, add business-meaningful query methods.

### State Machine Pattern (Billing)

**Location:** `package/billing/core/service/subscription-state-machine.service.ts`
**Purpose:** Domain-driven state transitions with validation.
**Implementation:** `Map<Status, AllowedTargetStatuses[]>` + `transition()` method that validates and mutates.

## Data Flow

### Content Creation (Movie Upload)

```
ManagementMovieController (extract params, thumbnail via multer)
  → CreateMovieUseCase (@Transactional('content'))
    → ExternalMovieRatingAdapter (fetch external rating via HTTP)
    → MediaFacade.createVideo (persist video entity)
    → MovieContent.create (factory method)
    → ContentRepository.saveMovieContent
    → VideoProcessorService.processMetadataAndModeration (BullMQ jobs)
```

### Catalog Listing (Public)

```
ContentResolver (GraphQL) → ListContentUseCase
ListCatalogContentUseCase → CatalogContentRepository.findAll()
ContentCatalogFacade (cross-module) → ListCatalogContentUseCase
```

Currently returns ALL content — no publishingStatus filter exists.

### Recommendations (Cross-Module)

```
RecommendationsController → PersonalizedRecommendationService
  → PreComputedRecommendationRepository (check cache)
  → RecommendationComputationService (@Transactional('recommendations'))
    → Promise.all([
        AnalyticsApi.getUserGenreAffinities(userId),
        AnalyticsApi.getUserWatchHistory(userId),
        ContentCatalogApi.findAllWithGenres()    ← Cross-module call
      ])
    → Score, rank, persist recommendations
```

## Code Organization

**Approach:** Domain-driven with explicit module boundaries
**Module boundaries:** NestJS module system + Nx enforce-module-boundaries ESLint rule
**Each module owns:** its database, entities, repositories, migrations
**Cross-module data:** via facade interfaces (in-process) or HTTP clients (out-of-process)
