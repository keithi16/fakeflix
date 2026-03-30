# Fakeflix — BugBot Project Rules

This file encodes Fakeflix-specific invariants that BugBot must enforce on every PR.
Rules are derived from the modular architecture principles, coding patterns, and
integration patterns used by this codebase.

---

## Module Structure

All business logic lives under `package/{module}/`. The expected layout is:

```
package/{module}/
  core/service/            ← business logic only
  core/use-case/           ← thin orchestration (calls one service)
  http/rest/controller/    ← HTTP layer, lean (<20 lines per method)
  http/rest/dto/           ← request/response DTOs
  http/client/             ← external API clients
  persistence/entity/      ← TypeORM entities
  persistence/repository/  ← repository classes
  queue/                   ← producers and consumers
  public-api/facade/       ← the only thing exported via index.ts
  index.ts                 ← exports ONLY the module class and facades
```

---

## Critical Architecture Rules

### Entity naming — State Isolation (BLOCKING)

If any changed file contains `@Entity({` or `@Entity('`, verify the entity name uses a module prefix.

- BAD: `@Entity({ name: 'Plan' })` in the billing module
- GOOD: `@Entity({ name: 'BillingPlan' })`

If an entity name is generic (e.g. `User`, `Plan`, `Content`, `Token`) with no module prefix, flag as blocking:
> "Entity names must be module-prefixed to prevent DB table collisions across modules. Rename to `{Module}{EntityName}`."

### Cross-module database access (BLOCKING)

If any changed file injects `@InjectRepository(SomeEntity, 'connectionName')` where `SomeEntity` is defined in a different module's `persistence/entity/` folder, flag as blocking:
> "Cross-module database access violates the State Isolation principle. Consume data from other modules via their public-api facade or through events, never by injecting their repositories directly."

### Repositories injected into controllers (BLOCKING)

If any changed controller file (`*.controller.ts`) has `@InjectRepository` or imports from `persistence/repository/`, flag as blocking:
> "Controllers must only inject services. Move repository access into a service."

### index.ts exporting internals (HIGH)

If `index.ts` exports anything other than a NestJS module class or a facade class (e.g. it exports a service, repository, or entity directly), flag as high severity:
> "`index.ts` must export only the module class and public-api facades. Exporting services or repositories breaks module encapsulation."

### Facade containing logic (HIGH)

If any changed file in `public-api/facade/` contains conditional branches, loops, data mapping, or direct repository access beyond a single delegating method call, flag as high severity:
> "Facades must be pure delegation to services. Move all logic into the service layer."

### Missing connectionName on @Transactional (HIGH)

If any changed file uses `@Transactional()` without a `connectionName` argument, flag as high severity:
> "Always specify `@Transactional({ connectionName: 'moduleName' })`. Omitting connectionName causes transactions to run on the default connection, which may be a different module's DB."

### Services or repositories exported from subdomains (HIGH)

If a `*.module.ts` lists any `*Service` or `*Repository` in its `exports` array instead of only `*Facade`, flag as high severity:
> "Subdomains must export only their facade, never internal services or repositories."

---

## Coding Patterns

### Fat controllers

If any `*.controller.ts` method body contains business logic (conditional branching, data transformation, direct DB calls) or exceeds ~20 lines, flag as warning:
> "Controllers must be lean. Delegate all logic to a service. A controller method should: validate → call service → return DTO."

### ORM leaking into services

If any `*Service` or `*UseCase` file imports from `typeorm` directly (e.g. `import { Repository } from 'typeorm'`) or uses raw query builders, flag as warning:
> "Services must not depend on ORM types directly. Use the repository abstraction layer."

### Unbounded queries (PERFORMANCE)

If any changed repository or service calls `.find()` or `.findAndCount()` without a `take` or `limit` argument, flag as performance issue:
> "Unbounded `find()` calls can return millions of rows. Always paginate with `take` and `skip`."

### N+1 queries (PERFORMANCE)

If any changed file calls a repository method inside a loop (`for`, `forEach`, `map`) with `await`, flag as performance issue:
> "Repository calls inside a loop cause N+1 queries. Fetch in bulk before the loop or use a join with `relations`."

---

## Security

### Auth guards on new controllers (HIGH)

If a new `*.controller.ts` is added with no `@UseGuards(...)` decorator at class or method level (and is not an explicitly public route like `/health`), flag as high severity:
> "New controllers must declare an explicit auth guard. Omitting guards defaults to unprotected endpoints."

### PII in logs (BLOCKING)

If any changed file logs fields like `email`, `password`, `token`, `secret`, `creditCard`, or `ssn` via `this.logger.*` or `console.log`, flag as blocking security issue:
> "Never log PII fields. Redact or omit sensitive fields before logging."

### External clients not encapsulated (HIGH)

If any service or controller directly instantiates an SDK client (e.g. `new Stripe(...)`, `new S3Client(...)`) instead of injecting it, flag as high severity:
> "External clients must be encapsulated in a dedicated client class under `http/client/` and injected via DI."

---

## E2E Test Coverage

### Missing e2e tests for new endpoints (HIGH)

If the PR adds or modifies a `*.controller.ts` and there is no corresponding change in any `*.e2e-spec.ts` file, flag as high severity:
> "New or modified endpoints require an e2e test covering the happy path and at least one error case in a `__test__/*.e2e-spec.ts` file."

### E2E anti-patterns

If any `*.e2e-spec.ts` changed in the PR:

- Uses a hardcoded numeric ID instead of a factory → warning: "Use entity factories instead of hardcoded IDs."
- Uses a raw HTTP status number instead of `HttpStatus.*` → warning: "Use `HttpStatus.OK` instead of `200`."
- Has no `afterEach` or `afterAll` cleanup → warning: "E2E tests must clean up created entities to avoid test pollution."

---

## Requirements Traceability

If the PR description contains no reference to a Jira ticket (pattern `[A-Z]+-[0-9]+`), a spec file under `.specs/`, or a linked GitHub issue, flag as warning:
> "PRs should link to a Jira ticket, spec file, or issue so reviewers can verify the implementation against requirements."
