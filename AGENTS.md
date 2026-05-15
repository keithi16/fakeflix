# Fakeflix - Agent Instructions

## Cursor Cloud specific instructions

### Infrastructure

- **PostgreSQL 15** and **Redis 7** run via Docker containers (`yarn docker:up`). Both must be running before starting the app or running tests.
- Docker daemon must be started first in Cloud Agent VMs: `dockerd &>/var/log/dockerd.log &` (wait ~5s), then `docker compose up --detach`.
- Docker in the Cloud Agent VM requires `fuse-overlayfs` storage driver and `iptables-legacy`. These are configured during initial setup.

### Running the application

- Start monolith: `npx nx start monolith` (builds via webpack then runs). Listens on port 3000.
- Start billing API: `npx nx start billing-api`. Listens on port 3001.
- Dev mode with watch: `npx nx start:dev monolith` (uses `@nx/js:node` executor with webpack rebuild).
- The `.env.local` files (root, `app/monolith/`, `app/billing-api/`) are auto-loaded by NX — no manual env setup needed.
- **Known issue**: `nx start` (webpack bundle) causes TypeORM entity metadata errors because entity glob patterns (`join(__dirname, 'entity', '*.entity.{ts,js}')`) don't resolve inside a webpack bundle. E2e tests are unaffected since they use NestJS testing modules directly.

### Testing

- All commands are in the root `package.json` scripts — see README for the full list.
- Key commands: `yarn lint:all`, `yarn test:unit:all`, `yarn test:e2e:all`, `yarn test:all`.
- E2e tests require PostgreSQL and Redis running. External APIs (TheMovieDB, Gemini) are mocked via `nock`.
- Run migrations before tests: `yarn db:migrate:all`.

### Key caveats

- The CI uses Node 20, but `.nvmrc` specifies Node 22. Both work for tests; the webpack build approach resolves the `exports`-field-with-`.ts`-files issue that previously broke `nest start` on Node 22.
- Identity and Content Catalog expose **GraphQL** endpoints (at `/graphql`). Billing, Analytics, and Recommendations use **REST**.
- Never create TypeORM migrations manually — always use `nx db:generate <packageName>`.

---

## Architecture Principles

**Structure:**

- Apps = Bootstraps (orchestration only)
- Packages = Business logic
- Modules = Independent, composable domains

**Module Structure:**

- package/module/core/services/ (Business logic)
- package/module/http/ (HTTP endpoints, external clients and DTOs)
- package/module/persistence/ (TypeORM entities/repos)

**10 Key Principles:**

1. Well-defined boundaries | 2. Composability | 3. Independence | 4. Individual scale | 5. Explicit communication
2. Replaceability | 7. Deployment independence | 8. State isolation ⚠️ | 9. Observability | 10. Fail independence

### Progressive Documentation Loading

**CRITICAL**: Only load documents relevant to your current task. Do NOT load all documentation at once.

#### Decision Tree: What to Read (Priority Order)

**Implementation tasks (writing code):**

- **Creating controllers, services, or repositories** → `docs/coding-patterns.md`
  - Repository pattern, lean controllers, transaction management, entity naming, state isolation
- **Integrating external APIs, third-party services, observability** → `docs/integration-patterns.md`
  - Client encapsulation, injection patterns, logging, metrics, circuit breakers, event systems

**Architecture/design tasks** → handled automatically by the `modular-architecture` skill:

- Creating modules, evaluating module boundaries, assessing compliance, maturity assessments

#### Quick Reference by Task Type


| Task Type                         | Primary Doc                    | Notes                        |
| --------------------------------- | ------------------------------ | ---------------------------- |
| New entity/migration              | `docs/coding-patterns.md`      | Entity naming section        |
| New controller/service/repository | `docs/coding-patterns.md`      | Full patterns doc            |
| External API integration          | `docs/integration-patterns.md` | Client encapsulation section |
| Logging/metrics/circuit breakers  | `docs/integration-patterns.md` | Resilience sections          |
| Create new module                 | `modular-architecture` skill   | Auto-triggered               |
| Evaluate module boundaries        | `modular-architecture` skill   | Auto-triggered               |
| Architecture compliance check     | `modular-architecture` skill   | Auto-triggered               |
| Maturity assessment               | `modular-architecture` skill   | Auto-triggered               |


---

## General Rules

### Context7 MCP

Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.

### Writing implementation plans

Remember that you are writing high quality and maintainable code while avoiding overengineering. You must be pragmatic and follow the guidelines in the docs first before blindly following industry standards.

Implementation plans should always include build and lint and e2e tests when necessary. To run build add `nx build <packageName>` and `nx lint:check <packageName>` and `yarn test:e2e <packageName>`.

### Implementation and Testing

IMPORTANT: always include e2e tests to cover important paths. You should always make sure that the plans include a test suite that covers the happy paths and edge cases. Your tests should be high quality and give confidence while covering most of the implementation.

### Database entities and migrations

Never create migrations manually — always use `nx db:generate <packageName>`. To run migrations always use `nx db:migrate <packageName>`.

---

## Integrations Config

### Confluence

- **Cloud ID:** d58e860b-469d-4463-8f46-684934a5a851
- **URL:** [https://techleadsclub.atlassian.net/](https://techleadsclub.atlassian.net/)

The Cloud ID can be:

- A site URL (e.g., `https://techleadsclub.atlassian.net/`)
- A UUID from `getAccessibleAtlassianResources`

