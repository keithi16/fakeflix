# Tech Stack

**Analyzed:** 2026-03-30

## Core

- Framework: NestJS 10.0.2
- Language: TypeScript 5.9.3
- Runtime: Node 22 (`.nvmrc`)
- Package manager: Yarn 1.22 (workspaces)
- Monorepo: Nx 22.0.3

## Backend

- API Style: REST (Express) + GraphQL (Apollo 4.7.5 / `@nestjs/graphql` 12.0.7)
- Database: PostgreSQL 15 via TypeORM 0.3.20 (`@nestjs/typeorm` 10.0.1)
- Transactions: `typeorm-transactional` 0.5.0 (named datasources per domain)
- Validation: class-validator 0.14.0 / class-transformer 0.5.1 (DTOs), Zod 3.21.4 (config)
- Authentication: `@nestjs/jwt` 10.1.0, bcrypt 5.1.1, `nestjs-cls` 5.4.3
- Queues: BullMQ 5.51.1 (`@nestjs/bullmq` 11.0.2) backed by Redis
- HTTP Client: `@nestjs/axios` 3.1.0, Axios 1.6.0
- Events: `@nestjs/event-emitter` 2.0.3 (infrastructure present, not widely wired)
- Logging: Winston 3.13.0 / nest-winston 1.10.0
- File uploads: Multer 1.4.5

## Testing

- Unit/Integration: Jest 30.0.5 (ts-jest 29.4.5, `@nx/jest` 22.0.3)
- HTTP assertions: Supertest 6.3.3
- HTTP mocking: nock 14.0.0-beta.4
- Factories: factory.ts 1.4.2, @faker-js/faker 10.1.0
- DB cleanup: Knex 3.1.0 (dev — table-level `del()` in test setup)
- Nest testing: @nestjs/testing 10.0.2

## External Services

- AI/ML: Google Gemini (`@google/genai` 0.9.0) — video summary, transcript, age recommendation
- Movie data: TMDb API (via Axios)
- Infrastructure: PostgreSQL 15-alpine (Docker), Redis 7-alpine (Docker)

## Development Tools

- Build: Webpack (via `@nx/webpack`), SWC (`@swc/core`, `@swc-node/register`)
- Lint: ESLint 9 (flat config) + Prettier 2.8.8
- Versioning: standard-version, Nx conventional commits
- CLI: NestJS CLI 10, dotenv-cli
