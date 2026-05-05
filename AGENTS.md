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
