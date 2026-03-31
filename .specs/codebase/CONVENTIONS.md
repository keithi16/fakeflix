# Code Conventions

## Naming Conventions

**Files:** kebab-case with role suffix
Examples: `catalog-content.repository.ts`, `list-catalog-content.use-case.ts`, `management-movie.controller.ts`, `content-type.enum.ts`, `create-movie.dto.ts`

**Classes:** PascalCase with role suffix
Examples: `CatalogContentRepository`, `ListCatalogContentUseCase`, `ManagementMovieController`, `ContentCatalogFacade`

**Interfaces:** PascalCase (no `I` prefix)
Examples: `ContentCatalogApi`, `BillingSubscriptionStatusApi`, `ExternalMovieRatingAdapter`

**Variables:** camelCase
Examples: `catalogContentRepository`, `contentRepository`, `videoProcessorService`

**Constants:** UPPER_SNAKE_CASE
Examples: `DEFAULT_CATALOG_LIMIT`, `QUEUE_NAME`, `MAX_RETRY_ATTEMPTS`

**Entity table names:** ModulePrefix + EntityName
Examples: `ContentItem`, `ContentVideo`, `ContentEpisode`, `BillingPlan`, `IdentityUser`

**DataSource names:** camelCase module name
Examples: `'content'`, `'billing'`, `'identity'`, `'recommendations'`

**Folders:** kebab-case
Examples: `core/service`, `http/rest/controller`, `persistence/repository`, `public-api/facade`

## Code Organization

**Import ordering:** External packages first (`@nestjs/*`, `@tlc/*`), then relative imports. No enforced import-sort ESLint rule — relies on convention.

**File structure within modules:**
```
module/
├── core/
│   ├── service/         # Domain services
│   ├── use-case/        # Application use cases
│   ├── enum/            # Domain enums
│   └── adapter/         # Port interfaces
├── http/
│   ├── rest/controller/ # REST controllers
│   ├── rest/dto/        # Request/response DTOs
│   ├── graphql/         # Resolvers + types
│   └── client/          # External HTTP clients
├── persistence/
│   ├── entity/          # TypeORM entities
│   ├── repository/      # Repositories
│   └── migration/       # TypeORM migrations
├── queue/
│   ├── producer/        # BullMQ job producers
│   └── consumer/        # BullMQ job consumers
├── public-api/
│   └── facade/          # Cross-module facade implementations
└── __test__/
    ├── e2e/             # E2E API tests (supertest)
    ├── integration/     # Integration tests (real DB, mocked externals)
    └── unit/            # Unit tests (mocked deps)
```

## Type Safety

**Approach:** TypeScript strict mode. Zod schemas for config validation. class-validator for DTO validation (global `ValidationPipe` with `transform: true`).

**Enums:** Always use enum members, never raw string literals. Import the enum in every file that uses its values.

## Error Handling

**Controllers:** Throw NestJS HTTP exceptions (`BadRequestException`, `UnauthorizedException`).
**Domain services:** Use domain-specific exceptions or broad try/catch with fallback (e.g., recommendations falls back to trending).
**HTTP clients:** Wrap failures in `HttpClientException` per integration-patterns.md.
**State machines:** Throw `BadRequestException` with descriptive message on invalid transitions.

## DTO Patterns

**Response DTOs:** `@Expose()` decorator on fields, `plainToInstance(DtoClass, entity, { excludeExtraneousValues: true })` in controllers.
**Request DTOs:** class-validator decorators (`@IsString()`, `@IsNotEmpty()`, etc.) under `http/rest/dto/request/`.

## Dependency Injection

**Default:** Constructor injection of concrete classes (use cases, repositories, services).
**Cross-module:** `@Inject(SymbolToken)` with interface type — token defined in `@tlc/shared-module/public-api`.
**Named DataSource:** `@InjectDataSource('moduleName')` in repositories.
**Config:** `ConfigService<ModuleConfig>` from `@nestjs/config`.

## Repository Pattern

- All repos extend `DefaultTypeOrmRepository<Entity>` (composition over inheritance)
- Methods have business-meaningful names (no TypeORM syntax in services)
- Named DataSource injection: `@InjectDataSource('content')`
- Never expose query builder or raw TypeORM methods

## Transaction Management

- `@Transactional({ connectionName: 'moduleName' })` on write methods
- Never without explicit connectionName in multi-database apps
- Never nested, never on read-only methods
