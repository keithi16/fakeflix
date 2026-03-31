# Project Structure

**Root:** `/Users/wneto/Dev/fakeflix`

## Directory Tree

```
fakeflix/
├── app/
│   ├── monolith/              # Main Nest app (all domains except billing)
│   └── billing-api/           # Separate billing API bootstrap
├── package/
│   ├── content/               # Content lifecycle domain
│   │   ├── catalog/           # Public catalog (GraphQL + facades)
│   │   ├── management/        # Admin CRUD (REST + file uploads)
│   │   ├── media/             # Video processing (BullMQ + Gemini)
│   │   ├── shared/            # Shared entities, persistence, events
│   │   └── content.module.ts
│   ├── identity/              # User auth + management (GraphQL)
│   ├── recommendations/       # Personalized recommendations (REST + BullMQ)
│   ├── analytics/             # Watch events, aggregation, reporting
│   │   ├── ingestion/
│   │   ├── aggregation/
│   │   └── reporting/
│   ├── billing/               # Subscriptions, invoices, usage
│   └── shared/
│       ├── module/            # Cross-cutting NestJS modules
│       │   ├── auth/          # JWT guards (AuthGuard, AdminGuard)
│       │   ├── config/        # Shared config helpers
│       │   ├── logger/        # Winston logger
│       │   ├── http-client/   # Axios wrapper
│       │   ├── typeorm/       # DefaultTypeOrmRepository, DefaultEntity
│       │   ├── event/         # EventEmitter wrapper
│       │   └── public-api/    # Cross-module interfaces + tokens
│       └── lib/
│           └── test/          # E2E test helpers (createNestApp, Tables enum)
├── docs/                      # Architecture docs, PRDs
├── .cursor/                   # Cursor rules and skills
├── .github/workflows/         # CI, deploy pipelines
├── docker-compose.yml
├── nx.json
├── package.json
└── tsconfig.base.json
```

## Module Organization

### content (catalog + management + media + shared)

**Purpose:** Full content lifecycle — creation, processing, catalog exposure.
**Location:** `package/content/`
**Key files:** `content.module.ts` imports all subdomains, exports only `ContentCatalogModule`.

### identity

**Purpose:** User authentication (sign-up, login, JWT), user management.
**Location:** `package/identity/`
**Key files:** GraphQL resolvers, TypeORM user entity, JWT + bcrypt.

### recommendations

**Purpose:** Personalized content recommendations, continue watching.
**Location:** `package/recommendations/`
**Key files:** REST API, BullMQ compute workers, cross-module calls to analytics + catalog.

### analytics

**Purpose:** Watch event ingestion, aggregation, trending, reporting.
**Location:** `package/analytics/`
**Key files:** Three subdomains (ingestion/aggregation/reporting) with BullMQ workers.

### billing

**Purpose:** Subscription management, invoicing, usage tracking.
**Location:** `package/billing/`
**Key files:** State machine for subscription lifecycle, simulated payment/tax clients.

### shared

**Purpose:** Cross-cutting infrastructure modules + test utilities.
**Location:** `package/shared/`
**Key files:** `DefaultTypeOrmRepository`, `AuthGuard`, `AdminGuard`, `ContentCatalogApi` interface + token.

## Where Things Live

**Content admin CRUD:**
- Controllers: `package/content/management/http/rest/controller/`
- Use cases: `package/content/management/core/use-case/`
- Persistence: `package/content/management/persistence/`
- E2E tests: `package/content/management/__test__/e2e/`

**Public catalog:**
- GraphQL: `package/content/catalog/http/graphql/resolver/`
- Use case: `package/content/catalog/core/use-case/`
- Facade: `package/content/catalog/public-api/facade/`
- E2E tests: `package/content/catalog/__test__/e2e/`

**Cross-module contracts:**
- Interfaces: `package/shared/module/public-api/interface/`
- HTTP clients: `package/shared/module/public-api/http/client/`

**Migrations:**
- Per-module: `package/<domain>/persistence/migration/` or `package/<domain>/shared/persistence/migration/`

## Special Directories

**`package/shared/lib/test/`:** E2E test bootstrap (`createNestApp`), table cleanup enum (`Tables`).
**`package/*/queue/`:** BullMQ producers/consumers for async work.
**`package/*/public-api/facade/`:** Implementations of cross-module API contracts.
**`.cursor/skills/`:** AI agent skills (modular-architecture, e2e-tests, etc.).
