# Testing Infrastructure

## Test Frameworks

**Unit/Integration:** Jest 30.0.5 + ts-jest 29.4.5 + @nestjs/testing ^10.0.2
**E2E:** supertest ^6.3.3 (HTTP/GraphQL API tests against real Nest app)
**HTTP mocking:** nock 14.0.0-beta.4
**DB cleanup:** knex ^3.1.0 (Postgres queries for test teardown)
**Factories:** @faker-js/faker, factory.ts, fishery, jest-when

## Test Organization

**Location:** Co-located `__test__/` directories within each module/subdomain.
**Naming:** `*.spec.ts` (exclusively — no `.test.ts` or `.e2e-spec.ts`).
**Structure:** `__test__/unit/`, `__test__/integration/`, `__test__/e2e/` subfolders.

## Testing Patterns

### Unit Tests

**Approach:** NestJS TestingModule with mocked dependencies (`jest.fn()`, `useValue`).
**Location:** `package/<domain>/core/service/__test__/unit/`
**Example:** `authentication.service.spec.ts` — mocks `UserRepository`, `JwtService`, `BillingSubscriptionStatusApi`.
**Pattern:** `Test.createTestingModule({ providers: [Service, { provide: Dep, useValue: mock }] })`.

### Integration Tests

**Approach:** Real NestJS app slice with real DB, external HTTP mocked via nock.
**Location:** `package/content/media/core/use-case/__test__/integration/`
**Example:** `transcribe-video.use-case.spec.ts` — `createNestApp([ContentMediaModule])`, real Postgres, nock for Gemini API.
**Teardown:** `cleanUpContentDatabase(testDbClient)` via Knex.

### E2E Tests

**Approach:** Full module HTTP tests via supertest. Real Postgres, mocked cross-module facades.
**Location:** `package/<domain>/__test__/e2e/`
**Setup:** `createNestApp` from `@tlc/shared-lib/test` or manual `Test.createTestingModule`.
**DB connection:** Knex client initialized from `ConfigService` (same DB as module under test).
**Teardown:** `testDbClient(Tables.Content).del()` per table in `afterEach`.
**Cross-module:** Facades mocked as `{ provide: Symbol, useValue: jest.fn() }`.

**E2E bootstrap pattern:**
```typescript
const nestTestSetup = await createNestApp([
  ConfigModule.forRoot({ load: [contentConfigFactory] }),
  ContentCatalogModule,
]);
app = nestTestSetup.app;
testDbClient = knex({ client: 'pg', connection: configService.get('content.database.url') });
```

## Test Execution

**Commands:**

| Script | Command |
|--------|---------|
| All tests | `yarn test:all` (unit then e2e) |
| All unit | `yarn test:unit:all` → `nx run-many --target=test:unit --all` |
| All e2e | `yarn test:e2e:all` → `nx run-many --target=test:e2e --all --parallel=3` |
| Affected unit | `yarn test:unit:affected` |
| Affected e2e | `yarn test:e2e:affected` |
| Package unit | `nx test:unit <package>` |
| Package e2e | `nx test:e2e <package>` |

## Coverage Targets

**Current:** No enforced coverage thresholds (no `coverageThreshold` in Jest configs).
**Output:** Per-package `coverage/package/<name>/` directories.
**Enforcement:** None — opt-in via `--coverage` flag.

## Test Coverage Matrix

| Code Layer | Required Test Type | Location Pattern | Run Command |
|---|---|---|---|
| Controllers (REST) | e2e | `package/*/__test__/e2e/**/*.spec.ts` | `nx test:e2e <package>` |
| GraphQL resolvers | e2e | `package/*/__test__/e2e/**/*.spec.ts` | `nx test:e2e <package>` |
| Domain services | unit | `package/*/core/service/__test__/unit/*.spec.ts` | `nx test:unit <package>` |
| Use cases (write, with DB) | e2e or integration | `package/*/__test__/e2e/**/*.spec.ts` | `nx test:e2e <package>` |
| Use cases (read, simple) | e2e (via controller) | covered by controller e2e | `nx test:e2e <package>` |
| Repositories | none (tested via e2e) | covered by e2e tests | — |
| Entities | none (tested via e2e) | covered by e2e tests | — |
| Facades | e2e | `package/*/public-api/__test__/e2e/**/*.spec.ts` | `nx test:e2e <package>` |
| HTTP clients | unit | `package/*/http/client/__test__/unit/*.spec.ts` | `nx test:unit <package>` |
| Queue consumers | none | no existing tests | — |
| DTOs | none (validated via e2e) | covered by e2e tests | — |
| Enums | none | — | — |

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|---|---|---|---|
| Unit tests | Yes | All deps mocked via `jest.fn()` | `authentication.service.spec.ts`, `recommendation-computation.service.spec.ts` |
| Integration tests | No | Shared Postgres DB, table-level cleanup in `afterEach` | `transcribe-video.use-case.spec.ts` uses `cleanUpContentDatabase` |
| E2E tests | No (within package) | Shared Postgres DB, `testDbClient(Tables.X).del()` in `afterEach` | `list-content.spec.ts`, `management-movie.spec.ts` |
| E2E tests | Yes (across packages) | Different DB per module (named DataSources) | `content.database.url` vs `recommendations.database.url` |

**Note:** `runInBand: true` is set for e2e targets in content, billing, analytics `project.json`. Cross-package parallelism (`--parallel=3`) is safe because each module uses a different DB.

## Gate Check Commands

| Gate Level | When to Use | Command |
|---|---|---|
| Quick | After tasks with unit tests only | `nx test:unit <package>` |
| Full | After tasks with e2e/integration tests | `nx test:unit <package> && nx test:e2e <package>` |
| Build | After phase completion | `nx build monolith && nx lint:check <package> && nx test:unit <package> && nx test:e2e <package>` |
