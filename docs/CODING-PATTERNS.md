# Coding Patterns for Modular Architecture

This document provides technical implementation patterns for repositories, controllers, and transaction management in our modular architecture.

> **Navigation**: Return to [ARCHITECTURE-OVERVIEW.md](./ARCHITECTURE-OVERVIEW.md) | See also [STATE-ISOLATION.md](./STATE-ISOLATION.md) | [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md)

## Table of Contents

- [Repository Pattern & ORM Encapsulation](#repository-pattern--orm-encapsulation)
- [Controller Responsibilities & Lean Pattern](#controller-responsibilities--lean-pattern)
- [Transaction Management & Named Connections](#transaction-management--named-connections)

---

## Repository Pattern & ORM Encapsulation

### Definition

Repositories MUST encapsulate all ORM-specific logic and never expose internal TypeORM APIs directly to the domain layer.

### Rules for AI Agents

- ✅ **DO**: Extend `DefaultTypeOrmRepository<Entity>` for all repositories
- ✅ **DO**: Use `@InjectDataSource('moduleName')` for named data source injection
- ✅ **DO**: Pass `dataSource.manager` to super constructor
- ✅ **DO**: Add custom query methods as needed
- ❌ **DON'T**: Extend TypeORM's `Repository` class directly
- ❌ **DON'T**: Expose TypeORM query builder or raw methods to services
- ❌ **DON'T**: Use `dataSource.createEntityManager()` in constructors

### Why DefaultTypeOrmRepository?

TypeORM's `Repository` class exposes 50+ methods including:
- `query()`, `createQueryBuilder()` - raw SQL access
- `increment()`, `decrement()` - direct column manipulation
- Internal methods that leak ORM implementation details

`DefaultTypeOrmRepository` uses **composition over inheritance**:
- Wraps TypeORM Repository as private property
- Exposes only safe, controlled methods: `save`, `findOne`, `find`, `exists`
- Prevents domain services from coupling to ORM internals
- Makes it easier to replace/mock in tests
- Enforces explicit query methods for complex queries

### Code Examples

```typescript
// ✅ GOOD: Proper repository encapsulation
// packages/billing/persistence/repository/invoice.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { Invoice } from '../entity/invoice.entity';

@Injectable()
export class InvoiceRepository extends DefaultTypeOrmRepository<Invoice> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(Invoice, dataSource.manager);
  }

  // Custom query methods with business meaning
  async findByUserId(userId: string): Promise<Invoice[]> {
    return this.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return this.findOne({
      where: { invoiceNumber },
      relations: ['lineItems', 'payments'],
    });
  }
}

// ❌ BAD: Direct TypeORM Repository extension
import { Repository } from 'typeorm';

@Injectable()
export class InvoiceRepository extends Repository<Invoice> {
  constructor(private dataSource: DataSource) {
    super(Invoice, dataSource.createEntityManager());
  }
  
  // Exposes all TypeORM methods like query(), increment(), etc.
  // Domain services can now call repo.query('RAW SQL') - coupling!
}

// ❌ BAD: Exposing query builder to services
@Injectable()
export class InvoiceService {
  async getInvoices(filters: any) {
    // Service now coupled to TypeORM API
    return this.invoiceRepo
      .createQueryBuilder('invoice')
      .where('invoice.status = :status', { status: filters.status })
      .getMany();
  }
}

// ✅ GOOD: Service uses repository abstraction
@Injectable()
export class InvoiceService {
  async getInvoices(status: string) {
    // Service only knows about domain methods
    return this.invoiceRepo.findByStatus(status);
  }
}
```

### Named DataSource Injection

Always use named data sources for module-specific database connections:

```typescript
// ✅ GOOD: Named injection
constructor(
  @InjectDataSource('billing')
  dataSource: DataSource
) {
  super(Entity, dataSource.manager);
}

// ❌ BAD: Default injection (ambiguous in multi-database apps)
constructor(
  dataSource: DataSource
) {
  super(Entity, dataSource.manager);
}
```

### Testing Benefits

```typescript
// Easy to mock with controlled interface
const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};

// No need to mock 50+ TypeORM methods
```

---

## Controller Responsibilities & Lean Pattern

### Definition

Controllers MUST be lean and only handle HTTP concerns (input/output). All business logic, orchestration, and data access MUST live in services.

### Rules for AI Agents

- ✅ **DO**: Keep controllers under 20 lines per method
- ✅ **DO**: Only call services (never repositories)
- ✅ **DO**: Only handle: request validation, service calls, response mapping
- ✅ **DO**: Use DTOs for request/response transformation
- ❌ **DON'T**: Put business logic in controllers
- ❌ **DON'T**: Call repositories directly from controllers
- ❌ **DON'T**: Perform calculations or data aggregation in controllers
- ❌ **DON'T**: Handle entity relationships in controllers

### Why Lean Controllers?

**Fat controllers lead to:**
- Untestable business logic (requires HTTP context)
- Duplicated logic across endpoints
- Tight coupling to HTTP framework
- Difficult to reuse logic (CLI, queues, events)
- Poor separation of concerns

**Lean controllers provide:**
- Framework-agnostic business logic
- Reusable services across contexts (HTTP, CLI, queues)
- Easy unit testing of business logic
- Clear separation: HTTP ↔ Application ↔ Domain

### Controller Responsibilities (ONLY)

1. **Extract request data** (params, body, query, headers)
2. **Validate request** (via DTOs and ValidationPipe)
3. **Extract user context** (from ClsService or request)
4. **Call service method** (single call, pass primitives/DTOs)
5. **Transform response** (entity → DTO using plainToInstance)
6. **Handle HTTP errors** (translate domain exceptions to HTTP)

### Code Examples

```typescript
// ✅ GOOD: Lean controller (8 lines of logic)
@Controller('invoices')
@UseGuards(AuthGuard)
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly clsService: ClsService,
  ) {}

  @Get()
  async getUserInvoices(): Promise<InvoiceResponseDto[]> {
    const userId = this.clsService.get('userId');
    const invoices = await this.invoiceService.getUserInvoices(userId);
    
    return invoices.map(invoice =>
      plainToInstance(InvoiceResponseDto, invoice, {
        excludeExtraneousValues: true,
      })
    );
  }
}

// ❌ BAD: Fat controller with business logic (50+ lines)
@Controller('usage')
export class UsageController {
  constructor(
    private readonly usageRecordRepository: UsageRecordRepository, // ❌ Repository injection
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  @Get('subscription/:subscriptionId')
  async getUsageSummary(@Param('subscriptionId') subscriptionId: string) {
    // ❌ Direct repository call
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });
    
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    
    // ❌ Direct repository call
    const usageRecords = await this.usageRecordRepository.findBySubscriptionIdAndPeriod(
      subscriptionId,
      subscription.currentPeriodStart,
      new Date()
    );
    
    // ❌ Business logic in controller
    const aggregation = await this.usageRecordRepository.aggregateUsageByType(
      subscriptionId,
      subscription.currentPeriodStart,
      new Date()
    );
    
    const summaries = [];
    
    // ❌ Data transformation and calculation logic
    for (const [usageType, totalQuantity] of aggregation.entries()) {
      const includedQuota = subscription.plan.includedUsageQuotas?.[usageType] || 0;
      const billableQuantity = Math.max(0, totalQuantity - includedQuota);
      const estimatedCost = billableQuantity * 0.10; // ❌ Business rule
      
      summaries.push({
        subscriptionId,
        usageType,
        totalQuantity,
        includedQuota,
        billableQuantity,
        estimatedCost,
      });
    }
    
    return summaries; // 50+ lines of logic!
  }
}

// ✅ GOOD: Same logic in service
@Injectable()
export class UsageBillingService {
  constructor(
    private readonly usageRecordRepository: UsageRecordRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async getUsageSummaryForSubscription(subscriptionId: string): Promise<UsageSummary[]> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });
    
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    
    const aggregation = await this.usageRecordRepository.aggregateUsageByType(
      subscriptionId,
      subscription.currentPeriodStart,
      new Date()
    );
    
    const summaries: UsageSummary[] = [];
    
    for (const [usageType, totalQuantity] of aggregation.entries()) {
      const includedQuota = subscription.plan.includedUsageQuotas?.[usageType] || 0;
      const billableQuantity = Math.max(0, totalQuantity - includedQuota);
      const estimatedCost = this.calculateEstimatedCost(billableQuantity, usageType);
      
      summaries.push({
        subscriptionId,
        usageType,
        totalQuantity,
        includedQuota,
        billableQuantity,
        estimatedCost,
      });
    }
    
    return summaries;
  }
  
  private calculateEstimatedCost(quantity: number, usageType: UsageType): number {
    // Business logic encapsulated in service
    return quantity * this.getUnitPrice(usageType);
  }
}

// ✅ GOOD: Lean controller using service
@Controller('usage')
export class UsageController {
  constructor(private readonly usageBillingService: UsageBillingService) {}

  @Get('subscription/:subscriptionId')
  async getUsageSummary(
    @Param('subscriptionId') subscriptionId: string
  ): Promise<UsageSummaryResponseDto[]> {
    const summaries = await this.usageBillingService.getUsageSummaryForSubscription(
      subscriptionId
    );
    
    return summaries.map(summary =>
      plainToInstance(UsageSummaryResponseDto, summary, {
        excludeExtraneousValues: true,
      })
    );
  }
}
```

### Service vs Controller Responsibilities

| Responsibility | Service | Controller |
|----------------|---------|------------|
| Business Logic | ✅ YES | ❌ NO |
| Data Validation (domain) | ✅ YES | ❌ NO |
| Repository Calls | ✅ YES | ❌ NO |
| Calculations | ✅ YES | ❌ NO |
| Orchestration | ✅ YES | ❌ NO |
| Entity Relationships | ✅ YES | ❌ NO |
| Request Validation (DTO) | ❌ NO | ✅ YES |
| HTTP Status Codes | ❌ NO | ✅ YES |
| Response Mapping (Entity→DTO) | ❌ NO | ✅ YES |
| User Context Extraction | ❌ NO | ✅ YES |

### Common Violations

#### 1. Direct Repository Calls

```typescript
// ❌ BAD
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionRepo: Repository<Subscription>) {}
  
  @Get(':id')
  async getSubscription(@Param('id') id: string) {
    return this.subscriptionRepo.findOne({ where: { id } });
  }
}

// ✅ GOOD
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}
  
  @Get(':id')
  async getSubscription(@Param('id') id: string) {
    return this.subscriptionService.getSubscriptionById(id);
  }
}
```

#### 2. Business Validation in Controller

```typescript
// ❌ BAD
@Post(':id/change-plan')
async changePlan(@Param('id') subscriptionId: string, @Body() dto: ChangePlanDto) {
  const subscription = await this.subscriptionRepo.findOne({ where: { id: subscriptionId } });
  
  // ❌ Business validation in controller
  if (!subscription) {
    throw new BadRequestException('Subscription not found');
  }
  
  // ❌ Ownership check in controller
  if (subscription.userId !== userId) {
    throw new ForbiddenException('Not your subscription');
  }
  
  return this.subscriptionService.changePlan(subscription.id, dto.newPlanId);
}

// ✅ GOOD
@Post(':id/change-plan')
async changePlan(@Param('id') subscriptionId: string, @Body() dto: ChangePlanDto) {
  const userId = this.clsService.get('userId');
  
  // Service handles all validation and business logic
  return this.subscriptionService.changePlanForUser(userId, subscriptionId, dto.newPlanId);
}
```

#### 3. Data Transformation Logic

```typescript
// ❌ BAD
@Get('summary')
async getSummary() {
  const data = await this.service.getData();
  
  // ❌ Complex transformation in controller
  return data.map(item => ({
    ...item,
    total: item.price * item.quantity,
    discount: item.discountPercent ? item.price * item.discountPercent / 100 : 0,
    final: (item.price * item.quantity) - (item.discountPercent ? item.price * item.discountPercent / 100 : 0),
  }));
}

// ✅ GOOD
@Get('summary')
async getSummary() {
  const summary = await this.service.getSummaryWithCalculations();
  
  return plainToInstance(SummaryResponseDto, summary, {
    excludeExtraneousValues: true,
  });
}
```

### Testing Benefits

```typescript
// ✅ Service is easily testable without HTTP context
describe('UsageBillingService', () => {
  it('should calculate usage summary', async () => {
    const summary = await service.getUsageSummaryForSubscription('sub-123');
    expect(summary[0].billableQuantity).toBe(25);
  });
});

// ❌ Fat controller requires HTTP test setup
describe('UsageController', () => {
  it('should return usage summary', async () => {
    // Need to setup entire HTTP stack just to test business logic
    return request(app.getHttpServer())
      .get('/usage/subscription/sub-123')
      .expect(200);
  });
});
```

### Migration Checklist

When refactoring fat controllers:

1. **Identify logic**: Find business logic, calculations, validations
2. **Create service method**: Move logic to appropriate service
3. **Update controller**: Replace logic with single service call
4. **Remove dependencies**: Remove repository injections from controller
5. **Update tests**: Move business logic tests to service tests
6. **Verify**: Controller should be <20 lines per method

### Detection Commands

```bash
# Find controllers with repository injections (likely violation)
grep -r "Repository" packages/*/http/rest/controller/*.ts

# Find long controller methods (>30 lines)
awk '/async.*\(.*\).*{/,/^  }/' packages/*/http/rest/controller/*.ts | \
  awk 'BEGIN{count=0;name=""} /async/{name=$0;count=0} /{count++} /^  }/ && count>30 {print name " - " count " lines"}'

# Count logic lines in controllers (should be minimal)
find packages/*/http/rest/controller -name "*.ts" -exec wc -l {} \; | sort -rn
```

---

## Transaction Management & Named Connections

### Definition

Services that perform database write operations (create, update, delete) MUST use the `@Transactional()` decorator with explicit `connectionName` to ensure data consistency and proper transaction isolation across modules.

### Rules for AI Agents

- ✅ **DO**: Use `@Transactional({ connectionName: 'moduleName' })` on all public methods that perform write operations
- ✅ **DO**: Use explicit connectionName matching your module's DataSource name
- ✅ **DO**: Apply decorator to methods that orchestrate multiple write operations
- ✅ **DO**: Apply decorator to methods that must maintain data consistency
- ❌ **DON'T**: Use `@Transactional()` without connectionName in multi-database apps
- ❌ **DON'T**: Nest `@Transactional()` methods (call from transactional to non-transactional only)
- ❌ **DON'T**: Add decorator to read-only methods

### Why Named Connections?

**Without connectionName** (ambiguous):
```typescript
@Transactional()  // Which database? Default? Billing? Content?
async createSubscription() { }
```

**With connectionName** (explicit):
```typescript
@Transactional({ connectionName: 'billing' })  // Clear: uses billing database
async createSubscription() { }
```

In monorepo apps with multiple modules and databases:
- Each module has its own named DataSource (`'billing'`, `'content'`, `'identity'`)
- TypeORM needs to know which connection to use for transaction
- Explicit naming prevents ambiguity and connection errors

### When to Use @Transactional()

**Always use for:**
1. **Single write operation** - Ensures atomicity
2. **Multiple write operations** - All-or-nothing semantics
3. **Read-then-write** - Prevents race conditions
4. **Cross-entity operations** - Maintains referential integrity

**Examples:**

```typescript
// ✅ Single write - ensures atomic save
@Transactional({ connectionName: 'billing' })
async createCredit(userId: string, amount: number) {
  const credit = new Credit({ userId, amount });
  return this.creditRepository.save(credit);
}

// ✅ Multiple writes - all succeed or all fail
@Transactional({ connectionName: 'billing' })
async addAddOn(subscription: Subscription, addOnId: string) {
  const subscriptionAddOn = new SubscriptionAddOn({
    subscriptionId: subscription.id,
    addOnId,
    startDate: new Date(),
  });
  
  await this.subscriptionAddOnRepository.save(subscriptionAddOn);
  
  subscription.addOns.push(subscriptionAddOn);
  await this.subscriptionRepository.save(subscription);
  
  return subscriptionAddOn; // Both saves succeed or both rollback
}

// ✅ Complex orchestration - maintains consistency
@Transactional({ connectionName: 'billing' })
async changePlan(userId: string, newPlanId: string) {
  // 1. Calculate proration
  const proration = await this.calculateProration(userId);
  
  // 2. Create invoice
  const invoice = await this.invoiceRepository.save(new Invoice({
    userId,
    amount: proration.amount,
  }));
  
  // 3. Update subscription
  const subscription = await this.subscriptionRepository.findByUserId(userId);
  subscription.planId = newPlanId;
  await this.subscriptionRepository.save(subscription);
  
  // 4. Apply credits
  await this.creditRepository.save(new Credit({
    userId,
    amount: proration.credit,
  }));
  
  return { invoice, subscription }; // All operations atomic
}

// ❌ Read-only - no transaction needed
async getSubscription(id: string) {
  return this.subscriptionRepository.findById(id);
}

// ❌ Multiple independent reads - no transaction needed
async getUserDashboard(userId: string) {
  const subscription = await this.subscriptionRepository.findByUserId(userId);
  const invoices = await this.invoiceRepository.findByUserId(userId);
  return { subscription, invoices };
}
```

### Code Examples from Billing Module

#### Example 1: Single Write Operation

```typescript
// package/billing/core/service/usage-billing.service.ts
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class UsageBillingService {
  @Transactional({ connectionName: 'billing' })
  async recordUsage(
    subscriptionId: string,
    usageType: UsageType,
    quantity: number,
    metadata?: Record<string, unknown>
  ): Promise<UsageRecord> {
    const usageRecord = new UsageRecord({
      subscriptionId,
      usageType,
      quantity,
      timestamp: new Date(),
      metadata,
    });
    
    return this.usageRecordRepository.save(usageRecord);
  }
}
```

#### Example 2: Multiple Related Writes

```typescript
// package/billing/core/service/add-on-manager.service.ts
@Injectable()
export class AddOnManagerService {
  @Transactional({ connectionName: 'billing' })
  async addAddOn(
    subscription: Subscription,
    addOnId: string,
    options: { quantity?: number; effectiveDate?: Date }
  ): Promise<{ subscriptionAddOn: SubscriptionAddOn; prorationCharge: number }> {
    // 1. Validate add-on exists
    const addOn = await this.addOnRepository.findById(addOnId);
    
    // 2. Create subscription-add-on relationship
    const subscriptionAddOn = new SubscriptionAddOn({
      subscriptionId: subscription.id,
      addOnId,
      quantity: options.quantity ?? 1,
      startDate: options.effectiveDate ?? new Date(),
    });
    
    await this.subscriptionAddOnRepository.save(subscriptionAddOn);
    
    // 3. Calculate prorated charge
    const prorationCharge = await this.calculateAddOnCharge(
      subscription,
      addOn,
      options.effectiveDate
    );
    
    // 4. Update subscription
    subscription.addOns.push(subscriptionAddOn);
    await this.subscriptionRepository.save(subscription);
    
    // All operations are atomic - if any fails, all rollback
    return { subscriptionAddOn, prorationCharge };
  }
}
```

#### Example 3: Complex Multi-Step Operation

```typescript
// package/billing/core/service/subscription-billing.service.ts
@Injectable()
export class SubscriptionBillingService {
  @Transactional({ connectionName: 'billing' })
  async changePlan(
    userId: string,
    newPlanId: string,
    options: { effectiveDate?: Date; chargeImmediately?: boolean }
  ): Promise<{ subscription: Subscription; invoice: Invoice }> {
    // Load subscription
    const subscription = await this.subscriptionRepository.findByUserId(userId);
    
    // Calculate proration credit from old plan
    const prorationCredit = await this.prorationCalculator.calculateCredit(
      subscription,
      new Date()
    );
    
    // Calculate proration charge for new plan
    const prorationCharge = await this.prorationCalculator.calculateCharge(
      newPlanId,
      options.effectiveDate ?? new Date()
    );
    
    // Build invoice line items
    const lineItems = [
      this.createProrationCreditLineItem(prorationCredit),
      this.createProrationChargeLineItem(prorationCharge),
    ];
    
    // Generate invoice
    const invoice = await this.invoiceGenerator.generateInvoice(
      subscription,
      lineItems,
      { dueDate: options.effectiveDate, immediateCharge: options.chargeImmediately }
    );
    
    // Update subscription
    subscription.planId = newPlanId;
    await this.subscriptionRepository.save(subscription);
    
    // Everything succeeds or everything rolls back
    return { subscription, invoice };
  }
}
```

### Anti-Patterns to Avoid

#### ❌ Missing connectionName

```typescript
// BAD: Ambiguous which database to use
@Transactional()
async createSubscription() {
  // May fail in multi-database setup
}

// GOOD: Explicit connection
@Transactional({ connectionName: 'billing' })
async createSubscription() {
  // Clear which database
}
```

#### ❌ Nested Transactional Methods

```typescript
// BAD: Calling transactional from transactional
@Transactional({ connectionName: 'billing' })
async outerMethod() {
  await this.innerMethod(); // innerMethod is also @Transactional
}

@Transactional({ connectionName: 'billing' })
async innerMethod() {
  // Nested transaction - problematic
}

// GOOD: Only outer method has decorator
@Transactional({ connectionName: 'billing' })
async outerMethod() {
  await this.innerMethod(); // innerMethod is plain async
}

async innerMethod() {
  // Runs in outer transaction context
}
```

#### ❌ Transaction on Read-Only Method

```typescript
// BAD: Unnecessary transaction overhead
@Transactional({ connectionName: 'billing' })
async getSubscription(id: string) {
  return this.subscriptionRepository.findById(id);
}

// GOOD: No transaction for reads
async getSubscription(id: string) {
  return this.subscriptionRepository.findById(id);
}
```

### Connection Name Mapping

Each module must use its DataSource name:

| Module | Connection Name | Example |
|--------|----------------|---------|
| `@billing/` | `'billing'` | `@Transactional({ connectionName: 'billing' })` |
| `@content/` | `'content'` | `@Transactional({ connectionName: 'content' })` |
| `@identity/` | `'identity'` | `@Transactional({ connectionName: 'identity' })` |

### Setup Requirements

For `@Transactional()` to work, the module's persistence module must configure `dataSourceFactory`:

```typescript
// package/billing/persistence/billing-persistence.module.ts
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: 'billing',
      inject: [ConfigService],
      useFactory: (configService: ConfigService<BillingConfig>) => {
        return dataSourceOptionsFactory(configService);
      },
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource({
          name: options.name,  // Must match connectionName in @Transactional
          dataSource: new DataSource(options),
        });
      },
    }),
  ],
})
export class BillingPersistenceModule {}
```

### Testing Transactions

```typescript
describe('SubscriptionBillingService', () => {
  it('should rollback all changes if invoice generation fails', async () => {
    // Arrange
    jest.spyOn(invoiceGenerator, 'generateInvoice').mockRejectedValue(new Error('Failed'));
    
    const initialPlanId = subscription.planId;
    
    // Act
    await expect(
      service.changePlan(userId, newPlanId, {})
    ).rejects.toThrow();
    
    // Assert - subscription should not be updated due to rollback
    const unchangedSubscription = await subscriptionRepo.findById(subscription.id);
    expect(unchangedSubscription.planId).toBe(initialPlanId);
  });
});
```

### Detection Commands

```bash
# Find methods with write operations but no @Transactional
grep -r "\.save\|\.create\|\.update\|\.delete" packages/*/core/service/*.ts | \
  grep -v "@Transactional"

# Find @Transactional without connectionName
grep -r "@Transactional()" packages/

# Check if dataSourceFactory is configured
grep -r "dataSourceFactory" packages/*/persistence/*.module.ts
```

---

## Summary

### Quick Reference

- **Repositories**: Extend `DefaultTypeOrmRepository`, use named DataSource injection
- **Controllers**: Keep lean (<20 lines), only call services, no business logic
- **Transactions**: Use `@Transactional({ connectionName: 'moduleName' })` for write operations

### Common Violations Checklist

- [ ] No repository extends TypeORM `Repository` directly
- [ ] All repositories use `@InjectDataSource('moduleName')`
- [ ] No controllers have repository injections
- [ ] All controller methods are under 20 lines
- [ ] All write operations use `@Transactional()` with connectionName
- [ ] No nested `@Transactional()` methods
- [ ] No read-only methods have `@Transactional()`

---

## Next Steps

- **State Isolation**: See [STATE-ISOLATION.md](./STATE-ISOLATION.md) for database and entity guidelines
- **Resilience**: See [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md) for monitoring patterns
- **Implementation**: See [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md) for verification

---

**Last Updated**: January 2026  
**Maintained By**: Architecture Team
