# State Isolation (Principle 8)

⚠️ **CRITICAL**: This is the most frequently violated principle in modular architecture. Read carefully before creating any database entities.

> **Navigation**: Return to [ARCHITECTURE-OVERVIEW.md](./ARCHITECTURE-OVERVIEW.md) | See also [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md) | [CODING-PATTERNS.md](./CODING-PATTERNS.md)

## Table of Contents

- [Definition](#definition)
- [Critical Violations](#critical-violations)
- [Rules for AI Agents](#rules-for-ai-agents)
- [Entity Naming Conventions](#entity-naming-conventions)
- [Code Examples](#code-examples)
- [Detection Commands](#detection-commands)
- [Migration Strategies](#migration-strategies)

---

## Definition

**State Isolation**: Each module owns and manages its own state without sharing databases or state with other modules.

This principle ensures:
- Clear data ownership
- Independent schema evolution
- Deployment flexibility
- Migration independence
- No accidental data coupling

---

## Critical Violations

### ❌ FORBIDDEN: Duplicate Entity Names Across Modules

**The most critical violation**: Multiple modules defining entities with the same `@Entity({ name: 'TableName' })`.

```typescript
// ❌ CRITICAL VIOLATION: Same entity name in different modules
// packages/billing/persistence/entity/plan.entity.ts
@Entity({ name: 'Plan' })
export class Plan extends DefaultEntity<Plan> {
  /* ... */
}

// packages/content/shared/persistence/entity/plan.entity.ts
@Entity({ name: 'Plan' }) // ❌ VIOLATION! Same table name
export class Plan extends DefaultEntity<Plan> {
  /* ... */
}
```

**Problems:**

- Both modules write to the same database table
- Unclear data ownership
- Migration conflicts
- Cannot deploy modules independently
- Schema changes affect multiple modules

**Solution:**

```typescript
// ✅ CORRECT: Module-specific entity names
// packages/billing/persistence/entity/plan.entity.ts
@Entity({ name: 'BillingPlan' })
export class Plan extends DefaultEntity<Plan> {
  /* ... */
}

// packages/content/persistence/entity/plan.entity.ts
@Entity({ name: 'ContentPlan' })
export class Plan extends DefaultEntity<Plan> {
  /* ... */
}
```

---

## Rules for AI Agents

- ✅ **DO**: Give each module its own database connection/schema
- ✅ **DO**: Make modules own their data migrations
- ✅ **DO**: Use events or APIs for cross-module data needs
- ✅ **DO**: Prefix entity names with module name
- ❌ **DON'T**: Share database tables between modules
- ❌ **DON'T**: Access other modules' data directly
- ❌ **DON'T**: Create duplicate entities with same @Entity names
- ❌ **DON'T**: Use foreign keys across module boundaries

---

## Entity Naming Conventions

**Rule**: Entity names MUST be prefixed with module name or use module-specific terminology.

### Good Patterns

```typescript
// Billing module
@Entity({ name: 'BillingPlan' })
@Entity({ name: 'BillingSubscription' })
@Entity({ name: 'BillingInvoice' })

// Content module
@Entity({ name: 'ContentItem' })
@Entity({ name: 'ContentVideo' })
@Entity({ name: 'ContentMovie' })

// Identity module
@Entity({ name: 'IdentityUser' })
@Entity({ name: 'IdentityProfile' })
@Entity({ name: 'IdentitySession' })
```

### Bad Patterns

```typescript
// ❌ Generic names without module prefix
@Entity({ name: 'Plan' })     // Which module owns this?
@Entity({ name: 'User' })     // Identity or Billing?
@Entity({ name: 'Item' })     // Too generic
@Entity({ name: 'Content' })  // Ambiguous
```

---

## Code Examples

### ✅ GOOD: Module-Specific Database Configuration

```typescript
// packages/billing/src/persistence/billing-persistence.module.ts
@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: 'billing', // Named connection
      inject: [ConfigService],
      useFactory: (configService: ConfigService<BillingConfig>) => ({
        type: 'postgres',
        host: configService.get('billing.database.host'),
        database: configService.get('billing.database.database'),
        entities: [
          Plan, // Only billing entities
          Subscription,
        ],
        migrations: ['dist/packages/billing/migrations/*.js'],
        migrationsTableName: 'billing_migrations',
      }),
    }),
  ],
})
export class BillingPersistenceModule {}

// packages/content/src/shared/persistence/persistence.module.ts
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'content', // Separate connection
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ContentConfig>) => ({
        type: 'postgres',
        host: configService.get('content.database.host'),
        database: configService.get('content.database.database'),
        entities: [
          Content, // Only content entities
          Movie,
          Video,
          Episode,
        ],
        migrations: ['dist/packages/content/migrations/*.js'],
        migrationsTableName: 'content_migrations',
      }),
    }),
  ],
})
export class ContentSharedPersistenceModule {}
```

### ✅ GOOD: Cross-Module Data Access via HTTP Client

```typescript
// packages/shared/module/public-api/http/client/billing-subscription-http.client.ts
@Injectable()
export class BillingSubscriptionHttpClient implements BillingSubscriptionStatusApi {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly configService: ConfigService
  ) {}

  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    const url = `${
      this.configService.get('billingApi').url
    }/subscription/user/${userId}/active`;
    const { isActive } =
      await this.httpClient.get<BillingApiUserSubscriptionActiveResponseDto>(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
    return isActive;
  }
}
```

### ✅ GOOD: Using String References Instead of Foreign Keys

```typescript
@Injectable()
export class SubscriptionService {
  // Keep userId as string reference, not FK relationship
  async createSubscription(userId: string, userData: UserBasicInfo, planId: string) {
    const subscription = this.subscriptionRepository.create({
      userId,
      planId,
      userName: userData.name, // Replicated data
      userEmail: userData.email, // Replicated data
      // No sensitive data, just what billing needs
    });
    await this.subscriptionRepository.save(subscription);
  }
}
```

### ❌ BAD: Accessing Another Module's Database

```typescript
@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(UserEntity, 'identity') // ❌ Wrong! This is from identity module
    private userRepository: Repository<UserEntity>
  ) {}
}
```

---

## Detection Commands

### MANDATORY: Run Before Claiming Compliance

**CRITICAL**: Run these commands before completing any State Isolation analysis:

#### 1. Check for Duplicate Entity Names (MOST IMPORTANT)

```bash
# Check for duplicate entity names
grep -r "@Entity.*name:" packages/ | \
  grep -o "name: '[^']*'" | sort | uniq -d
```

**Expected output**: Empty (no duplicates)

#### 2. Show Which Modules Have Duplicate Entities

```bash
# Show which modules have duplicate entities
grep -r "@Entity.*name:" packages/ | \
  sed 's/.*packages\/\([^/]*\)\/.*@Entity.*name: *['\''"]\([^'\''"]*\)['\''"].*/\1:\2/' | \
  sort | awk -F: '{if($2==prev){print "❌ DUPLICATE: " $2 " in " prevmod " and " $1} prevmod=$1; prev=$2}'
```

**Expected output**: Empty (no duplicates reported)

#### 3. Check for Identical Entity File Contents

```bash
# Check for identical entity file contents
find packages/ -name "*.entity.ts" -exec basename {} \; | \
  sort | uniq -d | xargs -I {} find packages/ -name {} -exec md5sum {} \;
```

**Expected output**: Empty or files with different checksums

#### 4. Cross-Module Import Detection

```bash
# Check for cross-module entity imports
grep -r "from.*@tlc.*/.*entity" packages/ | grep -v shared
```

**Expected output**: Empty (no cross-module entity imports)

#### 5. Shared Configuration Detection

```bash
# Check for shared database configurations
grep -r "host.*database.*username" packages/ | \
  grep -v "process.env.*_DATABASE_" | head -5
```

**Expected output**: Only environment-variable-based configurations

---

## State Isolation Verification Checklist

**MANDATORY**: Every AI agent MUST run this checklist before claiming State Isolation compliance:

### Step 1: Duplicate Entity Detection (CRITICAL)

```bash
# Check for duplicate @Entity names - MOST IMPORTANT CHECK
DUPLICATES=$(grep -r "@Entity.*name:" packages/ | grep -o "name: '[^']*'" | sort | uniq -d)
if [ ! -z "$DUPLICATES" ]; then
  echo "❌ CRITICAL VIOLATION: Duplicate entities found"
  exit 1
fi
```

**FAILURE CRITERIA**: If this finds ANY duplicates, State Isolation is VIOLATED regardless of other checks.

### Step 2: Cross-Module Import Detection

```bash
# Check for cross-module entity imports
grep -r "from.*@tlc.*/.*entity" packages/ | grep -v shared
```

### Step 3: Shared Configuration Detection

```bash
# Check for shared database configurations
grep -r "host.*database.*username" packages/ | \
  grep -v "process.env.*_DATABASE_" | head -5
```

---

## Migration Strategies

### Scenario 1: Found Duplicate Entity Names

**Problem**: Two modules using `@Entity({ name: 'Plan' })`

**Solution Steps**:

1. **Identify ownership**: Determine which module truly owns this data
2. **Rename entities**: Prefix with module name
3. **Update migrations**: Create migration to rename tables
4. **Update references**: Fix all repository and service references
5. **Verify**: Run detection commands again

**Example Migration**:

```typescript
// Migration: rename-plan-tables.ts
export class RenamePlanTables1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Billing module owns Plan
    await queryRunner.renameTable('Plan', 'BillingPlan');
    
    // Content module needs its own
    await queryRunner.query(`
      CREATE TABLE "ContentPlan" (
        ... // Copy structure, not data
      );
    `);
    
    // Migrate data if needed
    await queryRunner.query(`
      INSERT INTO "ContentPlan" (...)
      SELECT ... FROM "BillingPlan" WHERE ...
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('BillingPlan', 'Plan');
    await queryRunner.dropTable('ContentPlan');
  }
}
```

### Scenario 2: Cross-Module Database Access

**Problem**: Service accessing another module's database directly

**Solution Steps**:

1. **Create API contract**: Define interface in shared package
2. **Implement facade**: Create public API in owning module
3. **Add HTTP client**: Create client for consuming module
4. **Replace direct access**: Use client instead of repository
5. **Remove repository injection**: Clean up dependencies

**Example Refactor**:

```typescript
// BEFORE: Direct database access
@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(User, 'identity') // ❌ Cross-module access
    private userRepository: Repository<User>
  ) {}
  
  async getUserContent(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    // ...
  }
}

// AFTER: API-based access
@Injectable()
export class ContentService {
  constructor(
    private readonly identityClient: IdentityHttpClient // ✅ Uses API
  ) {}
  
  async getUserContent(userId: string) {
    const user = await this.identityClient.getUserById(userId);
    // ...
  }
}
```

---

## Common Questions

### Q: Can modules share a database server?

**A**: Yes, but each module must have its own database/schema. Never share tables.

```typescript
// ✅ GOOD: Same server, different databases
BILLING_DATABASE_HOST=postgres.prod.com
BILLING_DATABASE_NAME=billing_db

CONTENT_DATABASE_HOST=postgres.prod.com  // Same host OK
CONTENT_DATABASE_NAME=content_db         // Different DB required
```

### Q: How do I handle user data across modules?

**A**: Use data replication. Each module stores only the user data it needs.

```typescript
// Identity module owns full user data
@Entity({ name: 'IdentityUser' })
export class User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  // ... all user fields
}

// Billing module replicates minimal user data
@Entity({ name: 'BillingSubscription' })
export class Subscription {
  id: string;
  userId: string;        // String reference, not FK
  userEmail: string;     // Replicated for billing emails
  userName: string;      // Replicated for invoices
  // NO sensitive data like passwordHash
}
```

### Q: What about shared lookup tables?

**A**: Either:
1. Duplicate in each module (if small and stable)
2. Create a shared reference data service
3. Use events to sync reference data

**Never** share database tables directly.

---

## Automated Detection

### Pre-commit Hook Script

```bash
#!/bin/bash
# .git/hooks/pre-commit
echo "🔍 Checking State Isolation..."

VIOLATIONS=$(grep -r "@Entity.*name:" packages/ | \
  grep -o "name: '[^']*'" | sort | uniq -d)

if [ ! -z "$VIOLATIONS" ]; then
  echo "❌ COMMIT BLOCKED: Duplicate entity names found:"
  echo "$VIOLATIONS"
  echo ""
  echo "Fix by using module-specific entity names:"
  echo "  @Entity({ name: 'ModuleName_EntityName' })"
  exit 1
fi

echo "✅ State Isolation check passed"
```

---

## Summary

### ✅ State Isolation Checklist

- [ ] Each module has its own database connection with named DataSource
- [ ] All entities use module-prefixed names (e.g., `BillingPlan`, not `Plan`)
- [ ] No duplicate `@Entity` names across modules
- [ ] Cross-module data access uses APIs, not direct database access
- [ ] Each module owns its migrations independently
- [ ] No foreign key relationships across module boundaries
- [ ] Detection commands run clean (no violations)

### 🚫 Critical Violations to Avoid

1. ❌ Duplicate entity names across modules
2. ❌ Cross-module repository injection
3. ❌ Shared database tables
4. ❌ Foreign keys to other modules' tables
5. ❌ Accessing another module's database connection

---

## Next Steps

- **Coding Patterns**: See [CODING-PATTERNS.md](./CODING-PATTERNS.md) for repository and service patterns
- **Implementation Checklist**: See [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md) for verification steps
- **Module Principles**: See [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md) for principles 1-7

---

**Last Updated**: January 2026  
**Maintained By**: Architecture Team
