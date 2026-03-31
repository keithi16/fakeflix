# Tech Stack

**Analyzed:** 2026-03-31

## Core

- Framework: NestJS ^10.0.2
- Language: TypeScript 5.9.3
- Runtime: Node 22 (.nvmrc) / Node 20.19.0 (CI)
- Package manager: Yarn 1.x (workspaces)
- Monorepo: Nx 22.0.3
- Module system: CommonJS (target ES2020)

## Backend

- API Style: REST + GraphQL (Apollo Server ^4.7.5, `@nestjs/graphql` ^12.0.7)
- Database: PostgreSQL 15 (Docker) / 14 (CI), per-module named DataSources
- ORM: TypeORM ^0.3.20 (`@nestjs/typeorm` ^10.0.1)
- Transactions: `typeorm-transactional` ^0.5.0 with named connections
- Authentication: JWT (`@nestjs/jwt` ^10.1.0) + bcrypt ^5.1.1
- Request context: nestjs-cls ^5.4.3
- Validation: class-validator ^0.14.0, class-transformer ^0.5.1
- Config: `@nestjs/config` ^3.0.0 with Zod ^3.21.4 schemas

## Async / Events

- Queue: BullMQ ^5.51.1 (`@nestjs/bullmq` ^11.0.2) backed by Redis 7
- Events: `@nestjs/event-emitter` ^2.0.3 (in-process domain events)

## HTTP / External

- HTTP client: `@nestjs/axios` ^3.1.0, axios ^1.6.0
- AI/ML: `@google/genai` ^0.9.0 (Gemini — transcription, summaries, age recommendation)

## Testing

- Unit/Integration: Jest 30.0.5, ts-jest 29.4.5, `@nestjs/testing` ^10.0.2
- E2E HTTP: supertest ^6.3.3
- HTTP mocking: nock 14.0.0-beta.4
- DB cleanup: knex ^3.1.0 (direct Postgres queries in test teardown)
- Factories: @faker-js/faker ^10.1.0, factory.ts, fishery, jest-when

## Logging

- winston ^3.13.0, nest-winston ^1.10.0

## Lint / Format

- ESLint 9 + typescript-eslint 8.47.0
- Prettier ^2.8.8 (single quotes, semicolons, printWidth 90)
- eslint-plugin-project-structure, eslint-plugin-no-relative-import-paths

## Development Tools

- Docker Compose: PostgreSQL 15-alpine + Redis 7-alpine
- Release: standard-version + Nx Release (conventional commits)
