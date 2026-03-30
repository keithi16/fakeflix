# Project Structure

**Root:** `/Users/wneto/Dev/fakeflix`

## Directory Tree

```
fakeflix/
├── app/
│   ├── monolith/            # Main API (content + identity + analytics)
│   └── billing-api/         # Separate billing API
├── package/
│   ├── analytics/           # Analytics domain (ingestion, aggregation, reporting)
│   ├── billing/             # Billing domain (subscriptions, payments, invoicing)
│   ├── content/             # Content domain (catalog, management, media)
│   ├── identity/            # Identity domain (auth, users)
│   └── shared/
│       ├── lib/             # Shared library (models, exceptions, test utils)
│       └── module/          # Shared NestJS modules (auth, config, typeorm, logger, etc.)
├── docs/                    # Product documentation
├── .specs/                  # Spec-driven project docs
├── .github/                 # CI workflows and scripts
├── docker-compose.yml       # Postgres + Redis
├── nx.json                  # Nx workspace config
├── package.json             # Root dependencies + scripts
├── tsconfig.base.json       # Base TS config (es2020, CommonJS)
└── jest.config.ts           # Multi-project Jest root
```

## Module Organization

### Analytics (`@tlc/analytics`)

**Purpose:** Event ingestion, data aggregation (genre affinity, trending, binge detection), and reporting APIs.
**Location:** `package/analytics/`
**Submodules:** `ingestion/`, `aggregation/`, `reporting/`, `shared/`
**Key files:** `analytics.module.ts`, `public-api/facade/analytics.facade.ts`

### Billing (`@tlc/billing`)

**Purpose:** Subscriptions, payment processing, usage billing, invoicing, credit management.
**Location:** `package/billing/`
**Key files:** `billing.module.ts`, `public-api/facade/billing.facade.ts`

### Content (`@tlc/content`)

**Purpose:** Content catalog (GraphQL + REST), content management (admin), media processing (video streaming, AI-powered summaries).
**Location:** `package/content/`
**Submodules:** `catalog/`, `management/`, `media/`, `shared/`
**Key files:** `content.module.ts`

### Identity (`@tlc/identity`)

**Purpose:** User management, authentication (JWT), GraphQL API for auth/users.
**Location:** `package/identity/`
**Key files:** `identity.module.ts`, registers `GraphQLModule.forRoot` (Apollo, code-first)

### Shared (`@tlc/shared-lib`, `@tlc/shared-module`)

**Purpose:** Cross-cutting concerns — auth guards, config, TypeORM wrappers, logger, HTTP client, event emitter, public API interfaces.
**Location:** `package/shared/lib/` and `package/shared/module/`
**Subpath exports:** `@tlc/shared-module/auth`, `@tlc/shared-module/config`, `@tlc/shared-module/typeorm`, `@tlc/shared-module/public-api`, etc.

## Where Things Live

**Module internal layout (consistent across packages):**

- Business logic: `<module>/core/service/` or `<module>/core/use-case/`
- REST API: `<module>/http/rest/controller/` + `<module>/http/rest/dto/`
- GraphQL: `<module>/http/graphql/resolver/` + `<module>/http/graphql/type/`
- External clients: `<module>/http/client/<service-name>/`
- Persistence: `<module>/persistence/entity/`, `<module>/persistence/repository/`, `<module>/persistence/migration/`
- Queues: `<module>/queue/producer/`, `<module>/queue/consumer/`
- Public API (facades): `<module>/public-api/facade/`
- Tests: `<module>/__test__/e2e/`, `<module>/__test__/factory/`, `<module>/core/service/__test__/unit/`

## Special Directories

**`package/shared/module/public-api/`:** Defines cross-module interface contracts (e.g. `BillingSubscriptionStatusApi`, `AnalyticsApi`) with Symbol tokens. Implementations are provided by domain packages via `useExisting` or `useClass`.

**`package/shared/lib/test/`:** Test infrastructure — `createNestApp` helper, `Tables` enum for Knex cleanup, e2e setup utilities.
