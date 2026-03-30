# Testing Infrastructure

## Test Frameworks

**Unit/Integration:** Jest 30.0.5 (ts-jest 29.4.5, `@nx/jest` 22.0.3)
**E2E:** Jest + Supertest 6.3.3 (HTTP assertions on Nest app)
**HTTP mocking:** nock 14.0.0-beta.4
**Data factories:** factory.ts 1.4.2, @faker-js/faker 10.1.0
**Coverage:** HTML reporter (no threshold enforced)

## Test Organization

**Location:** Tests live in `__test__/` directories within each module, not co-located next to source files.
**Naming:** `*.spec.ts` exclusively (no `.test.ts`).
**Structure:**
- Unit: `<module>/core/service/__test__/unit/*.spec.ts`
- Integration: `<module>/core/use-case/__test__/integration/*.spec.ts`
- E2E: `<module>/__test__/e2e/<area>/*.spec.ts`

## Testing Patterns

### Unit Tests

**Approach:** `Test.createTestingModule` with `useValue: jest.fn()` for all dependencies. `beforeEach` compiles module. `jest.spyOn` for targeted behavior.
**Location:** `package/identity/core/service/__test__/unit/` (only package with explicit `test:unit` target)
**Example:** `authentication.service.spec.ts` — mocks `UserRepository`, `JwtService`, `BillingSubscriptionStatusApi`; asserts `UserUnauthorizedException` for invalid credentials.

### Integration Tests

**Approach:** Real Nest app with real database + nock for external HTTP. Uses `createNestApp` helper.
**Location:** `package/content/media/core/use-case/__test__/integration/`
**Example:** `generate-summary-for-video.use-case.spec.ts` — real DB, nock for Gemini API.

### E2E Tests

**Approach:** Full module stack via `createNestApp` from `@tlc/shared-lib/test`. Supertest against `app.getHttpServer()`. Real PostgreSQL via Knex for cleanup. nock for external APIs. JWT mocked via `jest.mock('jsonwebtoken')`.
**Location:** `package/<domain>/__test__/e2e/`
**Setup pattern:**
1. `beforeAll`: `createNestApp([ConfigModule.forRoot({ load: [...] }), DomainModule])`, init Knex connection
2. `beforeEach` / `afterEach`: delete rows from tables via Knex `del()`, `nock.cleanAll()`
3. Tests: Supertest requests (REST or `POST /graphql`)
4. `afterAll`: close app and destroy Knex connection

**Auth in e2e:** `jest.mock('jsonwebtoken', () => ({ verify: jest.fn((_, __, callback) => callback(null, { sub: userId, role: 'admin' })) }))` injected globally per spec file.

## Test Execution

**Commands:**

| Scope | Command |
|-------|---------|
| All tests | `yarn test:all` |
| All unit | `yarn test:unit:all` → `nx run-many --target=test:unit --all` |
| All e2e | `yarn test:e2e:all` → `nx run-many --target=test:e2e --all --parallel=3` |
| Affected unit | `yarn test:unit:affected` → `nx affected --target=test:unit` |
| Affected e2e | `yarn test:e2e:affected` → `nx affected --target=test:e2e --parallel=false` |
| Single package | `nx run <package>:test:e2e` (e.g. `nx run billing:test:e2e`) |
| Single unit | `nx run identity:test:unit` |
| Lint | `nx lint:check <project>` |
| Build | `nx build monolith` / `nx build billing-api` |

**Configuration:** Per-package `jest.config.ts` extends `../../jest.preset.js` (`@nx/jest/preset`), sets `testEnvironment: 'node'`, `coverageDirectory: ../../coverage/package/<name>`.

## Test Coverage Matrix

| Code Layer | Test Type | Location Pattern | Run Command | Notes |
|------------|-----------|------------------|-------------|-------|
| Services (identity) | Unit | `**/core/service/__test__/unit/*.spec.ts` | `nx run identity:test:unit` | Only package with a dedicated `test:unit` target |
| Use cases (content) | Integration (DB + nock) | `**/core/use-case/__test__/integration/*.spec.ts` | `nx run content:test:e2e` | Bundled into `test:e2e` target — no separate integration target exists |
| HTTP clients (content) | Unit (mocked deps) | `**/http/client/**/__test__/unit/*.spec.ts` | `nx run content:test:e2e` | Also bundled into `test:e2e` — these are true unit tests but matched by the e2e `testMatch` glob |
| Controllers (REST) | E2E | `**/__test__/e2e/**/*.spec.ts` | `nx run <package>:test:e2e` | |
| Resolvers (GraphQL) | E2E | `**/__test__/e2e/**/*.spec.ts` | `nx run identity:test:e2e` | |
| Shared modules | none | — | — | |
| Apps | none | — | — | |

**Gap: missing `test:unit` target.** Only `identity` has an explicit `test:unit` target in its `project.json` with a `testMatch` scoped to `**/unit/**/*.spec.ts`. All other packages (analytics, billing, content) bundle every `*.spec.ts` under a single `test:e2e` target — unit, integration, and e2e specs all run together. New packages (like recommendations) need a `test:unit` target added to `project.json` with a scoped `testMatch` to separate fast unit tests from slow DB-dependent tests.

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|-----------|---------------|-----------------|----------|
| Unit (identity) | Yes | All deps mocked via `jest.fn()` | No DB, no shared state |
| E2E (within package) | Yes (serial) | `runInBand: true` in all e2e jest configs | Tests run serially within a single package |
| E2E (across packages via Nx) | **No** | Shared database `fakeflix_test` | All packages use separate env var prefixes (`CONTENT_DATABASE_NAME`, `IDENTITY_DATABASE_NAME`, etc.) but all resolve to the same PostgreSQL database `fakeflix_test` on `localhost:5432`. Knex `del()` cleanup in one package can wipe rows created by another package running in parallel. `yarn test:e2e:affected` already uses `--parallel=false` (safe); `yarn test:e2e:all` uses `--parallel=3` (**unsafe** in local dev). |

**Implication for task planning:** Always run e2e tests for a single package at a time during development (`nx run <package>:test:e2e`). The `yarn test:e2e:all --parallel=3` command may produce flaky results locally due to shared DB state. CI should either use `--parallel=false` or provision separate databases per package.

## Gate Check Commands

| Gate Level | When to Use | Command |
|------------|-------------|---------|
| Quick | After tasks with unit tests only | `nx run identity:test:unit` |
| Full | After tasks with e2e tests | `nx run <package>:test:e2e` |
| Build | After phase completion | `nx build monolith && nx lint:check <package> && yarn test:all` |
