# Architecture

**Pattern:** Modular monolith (Nx) with domain packages and optional split deployment

## High-Level Structure

Apps are thin bootstraps (orchestration only). Packages hold all domain logic. Each domain package exposes a root `@Module` and is composed into apps via imports.

```
app/monolith → ContentModule + IdentityModule + AnalyticsModule
app/billing-api → BillingModule (separate deployment)
```

Config is merged at the app level: `ConfigModule.forRoot({ load: [contentConfigFactory, identityConfigFactory, ...] })`.

## Identified Patterns

### Layered Modules per Domain

**Location:** Every domain package (`analytics`, `billing`, `content`, `identity`)
**Purpose:** Enforce separation of concerns within each domain
**Implementation:** `core/` (services, use cases, adapters) → `http/` (controllers, resolvers, clients, DTOs) → `persistence/` (entities, repositories, migrations) → optional `queue/` (producers, consumers) and `public-api/` (facades)
**Example:** `package/analytics/ingestion/core/service/event-ingestion.service.ts` → `ingestion/http/rest/controller/player-event.controller.ts` → `ingestion/persistence/repository/view-event.repository.ts`

### Facade + Interface Token for Cross-Module Communication

**Location:** `package/shared/module/public-api/interface/`
**Purpose:** Decouple consumers from providers across module boundaries
**Implementation:** Shared interfaces with Symbol tokens (e.g. `BillingSubscriptionStatusApi`). Providers bind via `{ provide: Token, useExisting: ConcreteClass }`. Consumers depend on the abstraction.
**Example:** Identity imports `BillingSubscriptionStatusApi` → resolved to `BillingSubscriptionHttpClient` which calls billing REST API.

### Named TypeORM Datasources

**Location:** Each domain's `persistence/` layer
**Purpose:** Isolate database schemas per domain; support per-domain migrations
**Implementation:** `TypeOrmPersistenceModule.forRoot` with `dataSourceFactory` + `addTransactionalDataSource(connectionName)`. Each package has its own `typeorm-datasource.factory.ts`.
**Example:** `analytics` datasource, `content` datasource, `identity` datasource, `billing` datasource — each with separate migration tables.

### Repository Wrapper

**Location:** `package/shared/module/typeorm/repository/default-typeorm.repository.ts`
**Purpose:** Controlled data access surface — hides raw TypeORM `Repository` and exposes curated methods
**Implementation:** `DefaultTypeOrmRepository<T>` composes `Repository<T>` privately; exposes `save`, `findOne`, `find`, `exists`, etc. Domain repos extend this and inject `@InjectDataSource('<name>')`.

### Declarative Config with Zod

**Location:** Each package's `config.ts` (e.g. `package/content/config.ts`, `package/analytics/config.ts`)
**Purpose:** Type-safe, validated environment config
**Implementation:** Zod schemas with `safeParse` in factory functions. Config types inferred from schemas. Accessed via `ConfigService.get<Type>(path)`.

## Data Flow

### REST Request Flow

`HTTP → Controller (AuthGuard, ValidationPipe, ClsService for userId) → Service/UseCase (@Transactional) → Repository (DefaultTypeOrmRepository) → PostgreSQL`

Controllers are lean: validate input, extract user context from CLS, delegate to service, map domain exceptions to HTTP exceptions, return DTO via `plainToInstance`.

### Queue Processing Flow

`Controller/Service → QueueProducer.add(jobName, data) → Redis (BullMQ) → QueueConsumer.process(job) → Service → Repository → PostgreSQL`

Used for: analytics event processing, video transcription/summary, age recommendations, trending computation (repeatable scheduled jobs).

### GraphQL Flow

`GraphQL POST /graphql → Apollo → Resolver (AuthGuard) → Service → Repository → PostgreSQL`

Active for identity (auth, users) and content catalog. `GraphQLModule.forRoot` with `autoSchemaFile: true` (code-first).

## Code Organization

**Approach:** Domain-driven with layered internals

**Module boundaries:** Each domain package is an independent Yarn workspace with its own `package.json`, `project.json`, `jest.config.ts`, and TypeORM datasource. Cross-domain communication uses facade interfaces from `@tlc/shared-module/public-api` or HTTP clients.

**Submodule composition:** Larger domains (analytics, content) split into submodules (e.g. `ingestion`, `aggregation`, `reporting` in analytics; `catalog`, `management`, `media` in content). The root module composes submodules.
