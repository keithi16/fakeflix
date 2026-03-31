# Catalog Persistence Ownership Specification

## Problem Statement

The content module is split into three subdomains — management, catalog, and media — but catalog owns zero persistence: no entities, no repositories, no facades. All catalog-related logic (listing content, the cross-package `ContentCatalogApi`) lives in management. Catalog's `ListContentUseCase` is a stub that returns `[]`. This violates the subdomain-owned persistence principle and makes catalog impossible to evolve independently.

## Goals

- [ ] Catalog subdomain owns its read-side persistence and the public catalog API
- [ ] Management subdomain is focused purely on write-side CRUD operations
- [ ] Zero behavioral regression — all existing e2e tests pass unchanged

## Out of Scope

| Feature | Reason |
| --- | --- |
| New Content entity columns or migrations | No schema changes — catalog reuses the existing shared `Content` entity |
| New catalog-specific query endpoints | This refactoring establishes ownership; new features come after |
| Management REST API changes | Management's CRUD controllers and write-side repos stay as-is |
| Media subdomain changes | Media is already well-owned and not affected |
| Collaborative filtering or search | Future milestone work, not related to this structural fix |

---

## User Stories

### P1: Catalog owns read-side persistence ⭐ MVP

**User Story**: As a platform engineer, I want the catalog subdomain to own a read-focused ContentRepository so that catalog can query content independently without depending on management's repository.

**Why P1**: Without its own repository, catalog cannot serve any data — it's a dead shell.

**Acceptance Criteria**:

1. WHEN the catalog subdomain is loaded THEN it SHALL register its own `CatalogContentRepository` as a provider
2. WHEN `CatalogContentRepository.find()` is called THEN it SHALL return content from the shared `content` datasource
3. WHEN catalog queries content THEN it SHALL NOT import or reference any management persistence class

**Independent Test**: Can query content through catalog's repository in isolation.

---

### P1: Catalog owns the ContentCatalogApi ⭐ MVP

**User Story**: As a platform engineer, I want `ContentCatalogFacade` and `ContentCatalogApi` binding to live in the catalog subdomain so that the public catalog contract is owned by the right subdomain.

**Why P1**: The catalog API is a read concern — it belongs in catalog, not management. Other packages (recommendations) depend on this contract.

**Acceptance Criteria**:

1. WHEN a module imports `ContentCatalogModule` THEN it SHALL have access to `ContentCatalogApi`
2. WHEN `ContentCatalogApi.findAllWithGenres()` is called THEN it SHALL return all content with genres (same behavior as before)
3. WHEN `ContentManagementModule` is inspected THEN it SHALL NOT provide or export `ContentCatalogApi`
4. WHEN the root `ContentModule` is inspected THEN it SHALL export `ContentCatalogModule` (not `ContentManagementModule`)

**Independent Test**: Recommendations module can inject `ContentCatalogApi` and get results after the swap.

---

### P1: Catalog's GraphQL resolver works ⭐ MVP

**User Story**: As a platform engineer, I want catalog's `ContentResolver` to use a real listing use case so that the GraphQL `listContent` query returns actual data instead of `[]`.

**Why P1**: The resolver is broken — it returns empty arrays. Fixing it is part of giving catalog real functionality.

**Acceptance Criteria**:

1. WHEN the GraphQL `listContent` query is called THEN it SHALL return content from the database (not `[]`)
2. WHEN catalog's `ListContentUseCase` is inspected THEN it SHALL use `CatalogContentRepository` to query content

**Independent Test**: GraphQL query returns non-empty results when content exists in the database.

---

### P1: Clean module dependency graph ⭐ MVP

**User Story**: As a platform engineer, I want `ContentCatalogModule` to NOT import `ContentManagementModule` so that catalog is independently deployable and testable.

**Why P1**: The current circular re-export pattern (catalog imports management to re-export it) creates false dependencies and prevents independent evolution.

**Acceptance Criteria**:

1. WHEN `ContentCatalogModule` is inspected THEN it SHALL NOT import `ContentManagementModule`
2. WHEN `ContentCatalogModule` is loaded in isolation (e2e test) THEN it SHALL function without `ContentManagementModule`
3. WHEN management's write-side logic changes THEN catalog SHALL NOT require recompilation or retesting

**Independent Test**: Catalog e2e tests pass with only `ContentCatalogModule` loaded (no management).

---

## Edge Cases

- WHEN catalog's `CatalogContentRepository.find({})` returns zero results THEN the facade SHALL return an empty array (not null or error)
- WHEN the `content` datasource is unavailable THEN `CatalogContentRepository` SHALL propagate the TypeORM connection error (no special handling needed — same as management's behavior today)

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CAT-01 | P1: Catalog owns read-side persistence | Design | Pending |
| CAT-02 | P1: Catalog owns ContentCatalogApi | Design | Pending |
| CAT-03 | P1: Catalog's GraphQL resolver works | Design | Pending |
| CAT-04 | P1: Clean module dependency graph | Design | Pending |
| CAT-05 | P1: Zero regression | Design | Pending |

**ID format:** `CAT-[NUMBER]`

**Coverage:** 5 total, 0 mapped to tasks, 5 unmapped

---

## Success Criteria

- [ ] `ContentCatalogModule` has its own `CatalogContentRepository`, `ListCatalogContentUseCase`, `ContentCatalogFacade`
- [ ] `ContentManagementModule` no longer provides or exports `ContentCatalogApi`
- [ ] Root `ContentModule` exports `ContentCatalogModule`
- [ ] `nx run content:test:e2e` passes (zero regression)
- [ ] `nx run recommendations:test:e2e` passes (cross-module contract intact)
- [ ] `nx build monolith` succeeds
