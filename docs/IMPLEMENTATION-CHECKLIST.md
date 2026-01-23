# Implementation Checklist & Guidelines

This document provides practical checklists, verification steps, and automation tools for implementing modular architecture.

> **Navigation**: Return to [ARCHITECTURE-OVERVIEW.md](./ARCHITECTURE-OVERVIEW.md) | See all patterns: [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md) | [STATE-ISOLATION.md](./STATE-ISOLATION.md) | [CODING-PATTERNS.md](./CODING-PATTERNS.md) | [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md)

## Table of Contents

- [When Adding New Features](#when-adding-new-features)
- [When Refactoring Existing Code](#when-refactoring-existing-code)
- [State Isolation Verification](#state-isolation-verification)
- [Common Anti-Patterns to Avoid](#common-anti-patterns-to-avoid)
- [File Organization Patterns](#file-organization-patterns)
- [Detection Commands](#detection-commands)
- [Automated Verification](#automated-verification)

---

## When Adding New Features

Follow this checklist when implementing new functionality:

### 1. Identify the Correct Module

- [ ] Determine which domain the feature belongs to
- [ ] Verify the module exists or needs to be created
- [ ] Ensure feature aligns with module's bounded context
- [ ] Check if feature spans multiple modules (if yes, design communication)

### 2. Check Boundaries

- [ ] Feature doesn't violate module boundaries
- [ ] No direct dependencies on other modules' internal code
- [ ] Communication uses interfaces/facades only
- [ ] No shared database entities

### 3. Design Communication

If cross-module interaction is needed:

- [ ] Define explicit interface contract in shared package
- [ ] Document the contract with clear types
- [ ] Choose communication method (HTTP, events, queues)
- [ ] Implement facade in providing module
- [ ] Implement client in consuming module
- [ ] Add error handling and fallbacks

### 4. Implement with Patterns

- [ ] **Repository**: Extend `DefaultTypeOrmRepository`
- [ ] **Controller**: Keep lean (<20 lines), only call services
- [ ] **Service**: Use `@Transactional({ connectionName: 'moduleName' })` for writes
- [ ] **Entity**: Use module-prefixed name (e.g., `BillingPlan`)
- [ ] **Logging**: Add module-specific logger
- [ ] **Metrics**: Track relevant business/technical metrics

### 5. Add Resilience

- [ ] Circuit breaker for external service calls
- [ ] Timeout on all network calls
- [ ] Retry logic with exponential backoff
- [ ] Graceful degradation for non-critical features
- [ ] Error handling that doesn't cascade

### 6. Add Observability

- [ ] Structured logging with module identifier
- [ ] Correlation IDs for request tracing
- [ ] Metrics for key operations
- [ ] Health check updates if needed
- [ ] Error tracking

### 7. Verify State Isolation

**CRITICAL**: Run before committing:

```bash
# Check for duplicate entity names
grep -r "@Entity.*name:" packages/ | grep -o "name: '[^']*'" | sort | uniq -d

# Check for cross-module entity imports
grep -r "from.*@tlc.*/.*entity" packages/ | grep -v shared
```

### 8. Test Independence

- [ ] Unit tests for service logic
- [ ] Integration tests with only this module's dependencies
- [ ] E2E tests can run in isolation
- [ ] No tests depend on other modules' databases
- [ ] Mock external dependencies

### 9. Documentation

- [ ] Update module README if needed
- [ ] Document new interfaces/contracts
- [ ] Add code examples for complex logic
- [ ] Update architecture diagrams if structure changed

---

## When Refactoring Existing Code

Follow this checklist when modifying existing code:

### 1. Preserve Boundaries

- [ ] Don't break existing module boundaries
- [ ] Maintain interface stability (or version changes)
- [ ] Keep facade exports unchanged
- [ ] No new cross-module dependencies

### 2. Maintain Contracts

- [ ] Existing interfaces remain stable
- [ ] Add new optional fields instead of changing existing
- [ ] Version breaking changes appropriately
- [ ] Update documentation for contract changes

### 3. Improve Patterns

#### Fat Controller → Lean Controller

- [ ] Identify business logic in controller
- [ ] Move logic to service
- [ ] Update controller to call service
- [ ] Remove repository injections from controller
- [ ] Update tests (move business logic tests to service)

#### Direct Repository → DefaultTypeOrmRepository

- [ ] Change `extends Repository` to `extends DefaultTypeOrmRepository`
- [ ] Update constructor to use `@InjectDataSource('moduleName')`
- [ ] Pass `dataSource.manager` to super
- [ ] Add custom query methods as needed
- [ ] Update tests

#### Missing Transactions → Add @Transactional

- [ ] Identify write operations without `@Transactional`
- [ ] Add `@Transactional({ connectionName: 'moduleName' })`
- [ ] Ensure no nested transactional methods
- [ ] Test rollback behavior

### 4. Verify No Regressions

- [ ] Run module's unit tests
- [ ] Run module's integration tests
- [ ] Run module's E2E tests
- [ ] Check for linter errors
- [ ] Verify detection commands still pass

### 5. Update Documentation

- [ ] Reflect changes in module contracts
- [ ] Update code comments
- [ ] Update README if behavior changed
- [ ] Document breaking changes in CHANGELOG

---

## State Isolation Verification

**MANDATORY**: Run this checklist before claiming State Isolation compliance.

### Step 1: Duplicate Entity Detection (CRITICAL)

```bash
# Check for duplicate @Entity names - MOST IMPORTANT CHECK
DUPLICATES=$(grep -r "@Entity.*name:" packages/ | grep -o "name: '[^']*'" | sort | uniq -d)
if [ ! -z "$DUPLICATES" ]; then
  echo "❌ CRITICAL VIOLATION: Duplicate entities found"
  echo "$DUPLICATES"
  exit 1
fi
```

**Expected**: Empty output (no duplicates)

**FAILURE CRITERIA**: If ANY duplicates found, State Isolation is VIOLATED.

### Step 2: Cross-Module Import Detection

```bash
# Check for cross-module entity imports
VIOLATIONS=$(grep -r "from.*@tlc.*/.*entity" packages/ | grep -v shared)
if [ ! -z "$VIOLATIONS" ]; then
  echo "❌ Cross-module entity imports found:"
  echo "$VIOLATIONS"
  exit 1
fi
```

**Expected**: Empty output (no cross-module imports)

### Step 3: Shared Configuration Detection

```bash
# Check for shared database configurations
SHARED_CONFIGS=$(grep -r "host.*database.*username" packages/ | \
  grep -v "process.env.*_DATABASE_" | head -5)
if [ ! -z "$SHARED_CONFIGS" ]; then
  echo "⚠️  Warning: Potential shared database configurations found"
  echo "$SHARED_CONFIGS"
fi
```

**Expected**: Only environment-variable-based configurations

### Step 4: Module-Specific Connections

```bash
# Verify each module has named DataSource
for module in packages/*/persistence/*.module.ts; do
  if ! grep -q "name: '[a-z]*'" "$module"; then
    echo "❌ Missing named connection in $module"
  fi
done
```

**Expected**: All persistence modules have named connections

---

## Common Anti-Patterns to Avoid

### 1. Shared Database Access

❌ **NEVER** access another module's database directly:

```typescript
// ❌ BAD
@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(UserEntity, 'identity') // Wrong module!
    private userRepository: Repository<UserEntity>
  ) {}
}
```

✅ **DO** use APIs for cross-module data access:

```typescript
// ✅ GOOD
@Injectable()
export class BillingService {
  constructor(private readonly identityClient: IdentityHttpClient) {}
}
```

### 2. Duplicate Entity Names

❌ **NEVER** use same `@Entity` name across modules:

```typescript
// ❌ BAD - packages/billing/
@Entity({ name: 'Plan' })

// ❌ BAD - packages/content/
@Entity({ name: 'Plan' }) // Conflict!
```

✅ **DO** prefix with module name:

```typescript
// ✅ GOOD - packages/billing/
@Entity({ name: 'BillingPlan' })

// ✅ GOOD - packages/content/
@Entity({ name: 'ContentPlan' })
```

### 3. Direct Class Dependencies

❌ **NEVER** directly depend on other modules' classes:

```typescript
// ❌ BAD
import { UserService } from '@tlc/identity/core/service/user.service';

@Injectable()
export class BillingService {
  constructor(private userService: UserService) {}
}
```

✅ **DO** use interfaces and dependency injection:

```typescript
// ✅ GOOD
import { UserApiContract } from '@tlc/shared/interfaces';

@Injectable()
export class BillingService {
  constructor(
    @Inject('USER_API')
    private userApi: UserApiContract
  ) {}
}
```

### 4. Synchronous Cross-Module Calls

❌ **AVOID** synchronous dependencies that can block:

```typescript
// ❌ BAD - synchronous and blocking
const user = await this.identityService.getUser(userId);
const subscription = await this.billingService.getSubscription(user.id);
```

✅ **PREFER** async communication:

```typescript
// ✅ GOOD - async event-based
await this.eventPublisher.publish('user.created', { userId });
// Billing module listens and acts independently
```

### 5. Global State

❌ **NEVER** share mutable state between modules:

```typescript
// ❌ BAD - global cache shared across modules
export const globalCache = new Map();
```

✅ **DO** keep state within module boundaries:

```typescript
// ✅ GOOD - module-specific cache
@Injectable()
export class BillingCacheService {
  private cache = new Map();
}
```

### 6. Fat Controllers

❌ **DON'T** put business logic in controllers:

```typescript
// ❌ BAD - 50+ lines of logic in controller
@Get(':id')
async getInvoice(@Param('id') id: string) {
  const invoice = await this.repo.findOne(...);
  // ... 50 lines of calculations and logic
}
```

✅ **DO** keep controllers lean:

```typescript
// ✅ GOOD - controller delegates to service
@Get(':id')
async getInvoice(@Param('id') id: string) {
  const invoice = await this.invoiceService.getById(id);
  return plainToInstance(InvoiceDto, invoice);
}
```

### 7. Exported Internal Services

❌ **DON'T** export domain services in module index:

```typescript
// ❌ BAD - packages/billing/src/index.ts
export { SubscriptionService } from './core/service/subscription.service';
export { InvoiceRepository } from './persistence/repository/invoice.repository';
```

✅ **DO** export only facades and modules:

```typescript
// ✅ GOOD - packages/billing/src/index.ts
export { BillingModule } from './billing.module';
export { billingConfigFactory } from './config';
// Internal services stay internal
```

---

## File Organization Patterns

### 3-Level Hierarchy

Our codebase follows:

1. **Package** (Bounded Context): `billing/`, `content/`, `identity/`
2. **Module** (Sub-domain, optional): `content/admin/`, `content/catalog/`
3. **Feature** (Vertical Slice): `billing/subscription/`, `content/admin/movie/`

### Feature Structure

Each feature is a complete vertical slice:

```
feature-name/
├── core/          # Business logic (services, use-cases)
├── http/          # API layer (controllers, DTOs, clients)
├── persistence/   # Data access (entities, repositories)
├── queue/         # Async processing (consumers, producers) [if needed]
└── __test__/      # Tests (e2e, unit)
```

### When to Create Each Level

| Level       | Purpose               | Examples                           | When to Create                      |
| ----------- | --------------------- | ---------------------------------- | ----------------------------------- |
| **Package** | DDD Bounded Context   | `billing`, `content`, `identity`   | Different databases, teams, domains |
| **Module**  | Sub-domain separation | `content/admin`, `content/catalog` | Logical grouping within package     |
| **Feature** | Business capability   | `subscription`, `invoice`, `movie` | Individual user-facing feature      |

For detailed guidelines, see [FEATURE-FOLDERS.md](./FEATURE-FOLDERS.md).

---

## Detection Commands

### Quick Verification

Run these commands to detect common violations:

#### Check State Isolation

```bash
# 1. Duplicate entity names (CRITICAL)
grep -r "@Entity.*name:" packages/ | grep -o "name: '[^']*'" | sort | uniq -d

# 2. Cross-module entity imports
grep -r "from.*@tlc.*/.*entity" packages/ | grep -v shared

# 3. Which modules have duplicates
grep -r "@Entity.*name:" packages/ | \
  sed 's/.*packages\/\([^/]*\)\/.*@Entity.*name: *['\''"]\([^'\''"]*\)['\''"].*/\1:\2/' | \
  sort | awk -F: '{if($2==prev){print "❌ DUPLICATE: " $2 " in " prevmod " and " $1} prevmod=$1; prev=$2}'
```

#### Check Controller Violations

```bash
# Controllers with repository injections
grep -r "Repository" packages/*/http/rest/controller/*.ts

# Long controller methods (>30 lines)
awk '/async.*\(.*\).*{/,/^  }/' packages/*/http/rest/controller/*.ts | \
  awk 'BEGIN{count=0;name=""} /async/{name=$0;count=0} /{count++} /^  }/ && count>30 {print name " - " count " lines"}'
```

#### Check Transaction Usage

```bash
# Write operations without @Transactional
grep -r "\.save\|\.create\|\.update\|\.delete" packages/*/core/service/*.ts | \
  grep -v "@Transactional"

# @Transactional without connectionName
grep -r "@Transactional()" packages/
```

#### Check Repository Pattern

```bash
# Repositories extending TypeORM Repository directly
grep -r "extends Repository" packages/*/persistence/repository/*.ts

# Missing named DataSource injection
grep -L "@InjectDataSource" packages/*/persistence/repository/*.repository.ts
```

#### Check Observability

```bash
# Services without logging
find packages/*/core/service -name "*.service.ts" -exec grep -L "Logger" {} \;

# HTTP calls without timeout
grep -r "httpService\|axios" packages/ | grep -v "timeout:"

# External calls without try-catch
grep -r "await.*Client\." packages/*/core/service/*.ts | grep -v "try" -A 5
```

---

## Automated Verification

### Pre-commit Hook Script

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Running Architecture Verification..."

# 1. Check State Isolation (CRITICAL)
echo "Checking for duplicate entity names..."
DUPLICATES=$(grep -r "@Entity.*name:" packages/ | grep -o "name: '[^']*'" | sort | uniq -d)
if [ ! -z "$DUPLICATES" ]; then
  echo "❌ COMMIT BLOCKED: Duplicate entity names found:"
  echo "$DUPLICATES"
  echo ""
  echo "Fix by using module-specific entity names:"
  echo "  @Entity({ name: 'ModuleName_EntityName' })"
  exit 1
fi

# 2. Check Cross-Module Imports
echo "Checking for cross-module entity imports..."
CROSS_IMPORTS=$(grep -r "from.*@tlc.*/.*entity" packages/ | grep -v shared)
if [ ! -z "$CROSS_IMPORTS" ]; then
  echo "❌ COMMIT BLOCKED: Cross-module entity imports found:"
  echo "$CROSS_IMPORTS"
  exit 1
fi

# 3. Check Controller Violations
echo "Checking for controllers with repository injections..."
CONTROLLER_REPOS=$(grep -r "Repository" packages/*/http/rest/controller/*.ts 2>/dev/null)
if [ ! -z "$CONTROLLER_REPOS" ]; then
  echo "⚠️  Warning: Controllers with repository injections found:"
  echo "$CONTROLLER_REPOS"
  echo ""
  echo "Controllers should only inject services, not repositories."
fi

# 4. Check Transaction Usage
echo "Checking for @Transactional without connectionName..."
MISSING_CONNECTION=$(grep -r "@Transactional()" packages/ 2>/dev/null)
if [ ! -z "$MISSING_CONNECTION" ]; then
  echo "⚠️  Warning: @Transactional without connectionName found:"
  echo "$MISSING_CONNECTION"
  echo ""
  echo "Use: @Transactional({ connectionName: 'moduleName' })"
fi

echo "✅ Architecture verification passed"
exit 0
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

### CI/CD Integration

Add to your CI pipeline (`.github/workflows/architecture-check.yml`):

```yaml
name: Architecture Verification

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Check State Isolation
        run: |
          DUPLICATES=$(grep -r "@Entity.*name:" packages/ | grep -o "name: '[^']*'" | sort | uniq -d)
          if [ ! -z "$DUPLICATES" ]; then
            echo "❌ Duplicate entity names found"
            exit 1
          fi

      - name: Check Cross-Module Imports
        run: |
          VIOLATIONS=$(grep -r "from.*@tlc.*/.*entity" packages/ | grep -v shared)
          if [ ! -z "$VIOLATIONS" ]; then
            echo "❌ Cross-module entity imports found"
            exit 1
          fi

      - name: Check Controller Patterns
        run: |
          VIOLATIONS=$(grep -r "Repository" packages/*/http/rest/controller/*.ts)
          if [ ! -z "$VIOLATIONS" ]; then
            echo "⚠️  Controllers with repository injections"
            echo "$VIOLATIONS"
          fi
```

### Nx Integration

Add custom Nx target in `nx.json`:

```json
{
  "targetDefaults": {
    "verify-architecture": {
      "executor": "nx:run-commands",
      "options": {
        "commands": ["bash scripts/verify-architecture.sh"]
      }
    }
  }
}
```

Create `scripts/verify-architecture.sh`:

```bash
#!/bin/bash
set -e

echo "Running architecture verification..."

# Run all detection commands
bash scripts/check-state-isolation.sh
bash scripts/check-controller-patterns.sh
bash scripts/check-transaction-usage.sh

echo "✅ All checks passed"
```

---

## Quick Reference Cards

### New Feature Checklist

```
□ Identify correct module
□ Design communication (if cross-module)
□ Implement with patterns (Repository, Controller, Service)
□ Add resilience (circuit breaker, timeouts, retries)
□ Add observability (logging, metrics)
□ Verify state isolation (run detection commands)
□ Test independence
□ Document
```

### Refactoring Checklist

```
□ Preserve boundaries
□ Maintain contracts
□ Improve patterns (Controller → Lean, Repo → Default)
□ Verify no regressions
□ Update documentation
```

### Pre-Commit Checklist

```
□ Run: grep -r "@Entity.*name:" packages/ | grep -o "name: '[^']*'" | sort | uniq -d
□ Run: grep -r "from.*@tlc.*/.*entity" packages/ | grep -v shared
□ All tests pass
□ No linter errors
□ Documentation updated
```

---

## Summary

### Implementation Guidelines

When implementing features:

1. Follow the 10 principles
2. Use established patterns (Repository, Controller, Transaction)
3. Verify state isolation
4. Add resilience and observability
5. Test in isolation
6. Document changes

### Verification Steps

Before committing:

1. Run detection commands
2. Check for violations
3. Verify tests pass
4. Update documentation

### Automation

Set up:

1. Pre-commit hooks
2. CI/CD checks
3. Nx integration
4. Monitoring and alerts

---

## Next Steps

- **Module Principles**: See [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md)
- **State Isolation**: See [STATE-ISOLATION.md](./STATE-ISOLATION.md)
- **Coding Patterns**: See [CODING-PATTERNS.md](./CODING-PATTERNS.md)
- **Resilience**: See [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md)
- **Feature Organization**: See [FEATURE-FOLDERS.md](./FEATURE-FOLDERS.md)

---

**Last Updated**: January 2026  
**Maintained By**: Architecture Team
