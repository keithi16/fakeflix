# Catalog Persistence Ownership Tasks

**Design**: `.specs/features/catalog-persistence-ownership/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Create Catalog Components (Sequential)

New files, no module wiring yet. Codebase compiles but new code is unused.

```
T1 → T2 → T3
```

### Phase 2: Wire and Swap (Sequential)

Atomic module rewiring: register catalog providers, swap ContentCatalogApi ownership, remove old files, fix GraphQL resolver.

```
T3 → T4
```

### Phase 3: Verification (Sequential)

Full cross-module verification.

```
T4 → T5
```

---

## Task Breakdown

### T1: Create `CatalogContentRepository`

**What**: Create a read-focused repository for the catalog subdomain that wraps the shared `Content` entity using the `content` datasource.
**Where**: `package/content/catalog/persistence/repository/catalog-content.repository.ts`
**Depends on**: None
**Reuses**: `DefaultTypeOrmRepository<Content>` base class, management's `ContentRepository` as pattern reference
**Requirement**: CAT-01

**Tools**:

- MCP: `context7` (NestJS TypeORM patterns if needed)
- Skill: NONE

**Done when**:

- [ ] `CatalogContentRepository` extends `DefaultTypeOrmRepository<Content>`
- [ ] Uses `@InjectDataSource('content')` for the shared content datasource
- [ ] Imports `Content` from `shared/core` (not from management)
- [ ] No TypeScript errors
- [ ] Gate check passes: `nx lint:check content`

**Tests**: none (wired and tested in T4/T5)
**Gate**: quick — `nx lint:check content`

**Commit**: `refactor(content): add CatalogContentRepository for catalog read queries`

---

### T2: Create catalog `ListCatalogContentUseCase`

**What**: Create a use case in the catalog subdomain that queries content with genres for the cross-module catalog API. Adapted from management's version, using `CatalogContentRepository`.
**Where**: `package/content/catalog/core/use-case/list-catalog-content.use-case.ts`
**Depends on**: T1
**Reuses**: Management's `ListCatalogContentUseCase` logic (same mapping to `ContentCatalogItem[]`)
**Requirement**: CAT-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `ListCatalogContentUseCase` with `execute(): Promise<ContentCatalogItem[]>`
- [ ] Injects `CatalogContentRepository` (not management's `ContentRepository`)
- [ ] Maps results to `ContentCatalogItem` with `id`, `title`, `type`, `genres`, `releaseDate`
- [ ] No TypeScript errors
- [ ] Gate check passes: `nx lint:check content`

**Tests**: none (wired and tested in T4/T5)
**Gate**: quick — `nx lint:check content`

**Commit**: `refactor(content): add catalog ListCatalogContentUseCase`

---

### T3: Create catalog `ContentCatalogFacade`

**What**: Create a facade in the catalog subdomain that implements `ContentCatalogApi` by delegating to catalog's `ListCatalogContentUseCase`. Pure delegation, no logic.
**Where**: `package/content/catalog/public-api/facade/content-catalog.facade.ts`
**Depends on**: T2
**Reuses**: Management's `ContentCatalogFacade` delegation pattern
**Requirement**: CAT-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `ContentCatalogFacade` implements `ContentCatalogApi`
- [ ] `findAllWithGenres()` delegates to `ListCatalogContentUseCase.execute()`
- [ ] Pure delegation — no querying, mapping, or business logic in the facade
- [ ] Imports from catalog's own use case (not management's)
- [ ] No TypeScript errors
- [ ] Gate check passes: `nx lint:check content`

**Tests**: none (wired and tested in T4/T5)
**Gate**: quick — `nx lint:check content`

**Commit**: `refactor(content): add catalog ContentCatalogFacade`

---

### T4: Rewire modules and clean up management

**What**: Atomic module swap — register catalog's new providers, swap `ContentCatalogApi` ownership from management to catalog, fix the GraphQL resolver, update root exports, and delete old management files. This is the critical step that must happen as one unit to keep the codebase compilable.
**Where**:
- `package/content/catalog/content-catalog.module.ts` (update)
- `package/content/catalog/core/use-case/list-content.use-case.ts` (update — fix stub)
- `package/content/management/content-management.module.ts` (update)
- `package/content/content.module.ts` (update)
- `package/content/management/core/use-case/list-catalog-content.use-case.ts` (delete)
- `package/content/management/public-api/facade/content-catalog.facade.ts` (delete)
- `package/content/management/public-api/` (delete directory if empty)
**Depends on**: T3
**Reuses**: Existing module wiring patterns from `ContentMediaModule` (exports facade)
**Requirement**: CAT-01, CAT-02, CAT-03, CAT-04, CAT-05

**Tools**:

- MCP: NONE
- Skill: `modular-architecture` (subdomain persistence verification checklist)

**Done when**:

- [ ] `ContentCatalogModule` registers: `CatalogContentRepository`, `ListCatalogContentUseCase`, `ContentCatalogFacade`, `{ provide: ContentCatalogApi, useClass: ContentCatalogFacade }`
- [ ] `ContentCatalogModule` does NOT import `ContentManagementModule`
- [ ] `ContentCatalogModule` exports `ContentCatalogApi`
- [ ] `ListContentUseCase` (catalog's GraphQL use case) updated to inject `CatalogContentRepository` and return real query results instead of `[]`
- [ ] `ContentManagementModule` does NOT provide `ListCatalogContentUseCase`, `ContentCatalogFacade`, or `ContentCatalogApi`
- [ ] `ContentManagementModule` exports `[]` (empty)
- [ ] Root `ContentModule` exports `ContentCatalogModule` instead of `ContentManagementModule`
- [ ] Old management files deleted: `list-catalog-content.use-case.ts`, `content-catalog.facade.ts`
- [ ] No TypeScript errors
- [ ] `nx build monolith` succeeds
- [ ] Gate check passes: `nx lint:check content`

**Tests**: e2e (verified in T5)
**Gate**: quick — `nx build monolith && nx lint:check content`

**Commit**: `refactor(content): transfer ContentCatalogApi ownership from management to catalog`

---

### T5: E2E verification across modules

**What**: Run all e2e tests for content and recommendations to verify zero regression. Fix any broken test imports if necessary (e.g., test files that imported moved classes from management).
**Where**:
- `package/content/catalog/__test__/e2e/` (verify)
- `package/content/management/__test__/e2e/` (verify)
- `package/recommendations/__test__/e2e/` (verify)
**Depends on**: T4
**Reuses**: Existing e2e test infrastructure
**Requirement**: CAT-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `nx run content:test:e2e` passes — all existing content tests green
- [ ] `nx run recommendations:test:e2e` passes — ContentCatalogApi contract still works
- [ ] `nx build monolith` succeeds
- [ ] No test imports reference deleted management files
- [ ] Gate check passes: `nx build monolith && nx lint:check content && nx run content:test:e2e && nx run recommendations:test:e2e`
- [ ] Test count: existing content e2e test count unchanged, existing recommendations e2e test count unchanged

**Tests**: e2e
**Gate**: build — `nx build monolith && nx lint:check content && nx run content:test:e2e && nx run recommendations:test:e2e`

**Commit**: `test(content): verify catalog ownership transfer with cross-module e2e`

---

## Parallel Execution Map

```
Phase 1 (Sequential — each file depends on the previous):
  T1 ──→ T2 ──→ T3

Phase 2 (Sequential — atomic swap depends on all components):
  T3 ──→ T4

Phase 3 (Sequential — verification depends on swap):
  T4 ──→ T5
```

**Parallelism constraints:**

- T1→T2→T3 are sequential: T2 imports T1's class, T3 imports T2's class
- T4 is the atomic swap — must happen after all components exist
- T5 runs e2e tests using shared DB (`fakeflix_test`) — NOT parallel-safe per TESTING.md
- No `[P]` flags in this plan: all tasks are sequential due to compile-time dependencies and shared DB tests

---

## Requirement → Task Traceability

| Requirement | Primary Task | Verified In |
| --- | --- | --- |
| CAT-01: Catalog owns read-side persistence | T1, T4 | T5 (e2e) |
| CAT-02: Catalog owns ContentCatalogApi | T2, T3, T4 | T5 (e2e) |
| CAT-03: GraphQL resolver works | T4 | T5 (e2e) |
| CAT-04: Clean module dependency graph | T4 | T5 (e2e) |
| CAT-05: Zero regression | T5 | T5 (e2e) |

**Coverage:** 5 requirements, 5 mapped to tasks, 0 unmapped

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | No incoming arrows | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: CatalogContentRepository | Repository (new) | none (repos not unit-tested in this codebase) | none | ✅ OK |
| T2: ListCatalogContentUseCase | Use case (new) | integration (DB + nock) | none (tested in T5) | ⚠️ SEE NOTE |
| T3: ContentCatalogFacade | Facade (new) | none (facades not independently tested) | none | ✅ OK |
| T4: Module wiring + cleanup | Module configs (modify) + use case (modify) | none (shared modules) + integration (use case) | e2e (verified in T5) | ⚠️ SEE NOTE |
| T5: E2E verification | Test files (verify/fix) | e2e | e2e | ✅ OK |

**NOTE on T2 and T4**: The coverage matrix says use cases require integration tests. However, this is a **refactoring** — the `ListCatalogContentUseCase` logic is identical to management's existing (already tested) version. The use case cannot be tested until T4 wires it into a module (NestJS DI requires module registration for the TypeORM datasource). T5 provides full e2e coverage that exercises the use case through the real module stack. This is "merge forward" per the co-location rules: the earliest task where tests become runnable is T5, which includes them.
