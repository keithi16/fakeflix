# Code Conventions

## Naming Conventions

**Files:**
Kebab-case with role suffix: `event-ingestion.service.ts`, `player-event.controller.ts`, `analytics-view-event.entity.ts`, `create-movie.use-case.ts`, `video-summary.queue-consumer.ts`, `external-movie-rating.client.ts`

**Classes:**
PascalCase with role suffix: `EventIngestionService`, `PlayerEventController`, `ViewEventRepository`, `CreateMovieUseCase`, `MediaFacade`, `BillingSubscriptionHttpClient`, `VideoSummaryQueueConsumer`

**Methods:**
- Controllers: verb phrases — `recordEvent`, `createSubscription`, `uploadMovie`, `streamVideo`
- Services: domain verbs — `recordEvent`, `createSubscription`, `getUserById`
- Use cases: `execute()` as the single public method

**Constants:**
Object-based enums for queue names (`QUEUES.VIDEO_SUMMARY`), `Tables` enum for test cleanup

## Code Organization

**Import ordering:**
NestJS/external packages first, then `@tlc/...` shared imports, then relative imports. Not strictly enforced but consistently followed.

**File structure:**
- Decorators at class level (`@Controller`, `@Injectable`)
- Constructor injection first
- Public methods, then private
- One class per file

## Type Safety

**Request validation:** `class-validator` decorators on DTO classes + global `ValidationPipe({ transform: true })` in `main.ts`

**Config validation:** Zod schemas in `config.ts` files with `safeParse` + inferred TypeScript types. Accessed via typed `ConfigService.get<T>(path)`.

**GraphQL types:** `@ObjectType()` + `@Field()` decorators, sometimes combined with `class-validator` on the same class.

**Response mapping:** `plainToInstance(DtoClass, data, { excludeExtraneousValues: true })` with `@Expose()` on response DTOs.

## Error Handling

**Domain layer:** Custom exceptions extending `DomainException` from `@tlc/shared-lib` (e.g. `NotFoundDomainException`, `UserUnauthorizedException`).

**HTTP layer:** Controllers catch domain exceptions and map to NestJS HTTP exceptions (`NotFoundException`, `BadRequestException`, `InternalServerErrorException`). Pattern: `try/catch` in controller methods.

**GraphQL:** NestJS exception filters handle mapping automatically.

## Dependency Injection

Constructor injection throughout. Interface bindings use `@Inject(TOKEN)` with Symbol tokens for cross-module contracts (e.g. `@Inject(ExternalMovieRatingAdapter)`).

Module registration: `{ provide: Token, useClass: Implementation }` or `{ provide: Token, useExisting: ConcreteClass }`.

## Barrel Files

Package entrypoints (`index.ts`) export the root module, config factory, and key enums. Shared modules use `export * from` in subpath index files (`auth/index.ts`, `typeorm/index.ts`). Not every folder has a barrel — many imports use direct file paths.
