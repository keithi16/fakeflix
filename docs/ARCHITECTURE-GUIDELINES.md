# Modular Architecture Guidelines for AI Agents

This document provides explicit guidelines for AI agents working with modular architectures in monorepos. These principles ensure maintainable, scalable, and resilient systems.

## Core Philosophy

**Modular Architecture** is a pragmatic approach that avoids premature microservices complexity while maintaining clear boundaries between business domains. It provides the benefits of both monoliths (development simplicity) and distributed systems (independence and scalability).

### Key Concepts

- **Apps are Bootstraps**: Applications (`apps/`) only orchestrate modules, containing minimal logic
- **Packages are Logic**: All business logic lives in packages (`packages/`), enabling maximum reusability
- **Domain-Based Organization**: Organize by business capabilities, not technical features
- **Evolutionary Design**: Start modular, extract to microservices only when proven necessary

## Document Scope

This document focuses on **inter-package architecture** (how packages interact and the principles that govern modular systems).

For **intra-package organization** (how to structure code within a package), see:
- **[FEATURE-FOLDERS.md](./FEATURE-FOLDERS.md)** - Organizing packages into feature folders (vertical slices)
- Decision trees for creating features
- Cohesion criteria and real examples
- Shared folder rules

## The 10 Principles of Modular Architecture

### 1. Well-Defined Boundaries

**Definition**: Each module has clear responsibilities and doesn't expose internal details to other modules.

**Rules for AI Agents**:

- ✅ **DO**: Keep all domain logic within the module's boundaries
- ✅ **DO**: Export only public facades and interfaces
- ❌ **DON'T**: Import internal classes from other modules
- ❌ **DON'T**: Share database entities between modules

**Code Examples**:

```typescript
// ✅ GOOD: Public facade export
// packages/billing/src/index.ts
export { BillingModule } from './billing.module';
export { billingConfigFactory } from './config';

// ❌ BAD: Exposing internal implementation
export { SubscriptionService } from './core/service/subscription.service';
export { SubscriptionRepository } from './persistence/repository/subscription.repository';
export { Subscription } from './persistence/entity/subscription.entity';
```

**File Structure Example**:

```
packages/billing/
├── subscription/           # Feature folder (vertical slice)
│   ├── core/
│   │   ├── service/        # Domain services
│   │   └── use-case/       # Application use cases
│   ├── http/rest/
│   │   ├── controller/     # REST controllers
│   │   └── dto/            # Request/Response DTOs
│   └── persistence/
│       ├── entity/         # Subscription entities
│       └── repository/     # Subscription repositories
├── invoice/                # Feature folder (vertical slice)
│   ├── core/
│   ├── http/
│   └── persistence/
├── shared/                 # Shared infrastructure only
│   └── persistence/        # TypeORM config, migrations
└── index.ts                # Only exports BillingModule + config
```

> 💡 **Note**: See [FEATURE-FOLDERS.md](./FEATURE-FOLDERS.md) for detailed guidelines on organizing features within packages.

### 2. Composability

**Definition**: Modules are designed as building blocks that can be combined flexibly to create different applications.

**Rules for AI Agents**:

- ✅ **DO**: Design modules to work independently or together
- ✅ **DO**: Create multiple apps with different module combinations
- ✅ **DO**: Use dependency injection for loose coupling
- ❌ **DON'T**: Create tight coupling between modules

**Code Examples**:

```typescript
// ✅ GOOD: Composable app structure
// apps/monolith/src/monolith.module.ts
@Module({
  imports: [
    ContentModule, // Domain module
    IdentityModule, // Another domain module
    ConfigModule.forRoot({
      load: [contentConfigFactory, identityConfigFactory],
    }),
  ],
})
export class MonolithModule {}

// apps/billing-api/src/billing-api.module.ts
@Module({
  imports: [
    BillingModule, // Only what this app needs
    ConfigModule.forRoot({
      load: [billingConfigFactory],
    }),
  ],
})
export class BillingApiModule {}

// ✅ GOOD: Module with optional dependencies
@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  providers: [
    SubscriptionService,
    {
      provide: 'BILLING_NOTIFICATION_SERVICE',
      useFactory: (config: ConfigService) => {
        return config.get('NOTIFICATIONS_ENABLED')
          ? new EmailNotificationService()
          : new NoOpNotificationService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [SubscriptionService],
})
export class BillingModule {}
```

### 3. Independence

**Definition**: Modules operate autonomously without tight coupling in code or infrastructure.

**Rules for AI Agents**:

- ✅ **DO**: Ensure modules can be built, tested, and deployed independently
- ✅ **DO**: Use interfaces and events for inter-module communication
- ✅ **DO**: Make each module's tests runnable in isolation
- ❌ **DON'T**: Create shared mutable state between modules
- ❌ **DON'T**: Use direct method calls between modules

**Code Examples**:

```typescript
// ✅ GOOD: Independent module with its own configuration
// packages/billing/src/billing.module.ts
@Module({
  imports: [
    BillingPersistenceModule,
    AuthModule,
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
  ],
  providers: [SubscriptionService, BillingFacade],
  controllers: [SubscriptionController],
  exports: [BillingFacade],
})
export class BillingModule {}

// ✅ GOOD: Communication via interfaces (not direct calls)
export interface BillingSubscriptionStatusApi {
  isUserSubscriptionActive(userId: string): Promise<boolean>;
}

@Injectable()
export class BillingFacade implements BillingSubscriptionStatusApi {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  public async isUserSubscriptionActive(userId: string): Promise<boolean> {
    return await this.subscriptionService.isUserSubscriptionActive(userId);
  }
}

// ❌ BAD: Direct dependency on another module
@Injectable()
export class SubscriptionService {
  constructor(
    private identityService: IdentityService // ❌ Direct coupling
  ) {}
}
```

**Testing Independence Example**:

```typescript
// ✅ GOOD: Each module has independent test setup
// packages/billing/src/__test__/e2e/subscription/subscription.spec.ts
describe('Billing Module E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([
      ConfigModule.forRoot({
        load: [billingConfigFactory],
      }),
      BillingModule, // Only this module
    ]);
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should manage billing functionality independently', async () => {
    // Test billing functionality in isolation
  });
});
```

### 4. Individual Scale

**Definition**: Each module can scale based on its specific resource needs without affecting others.

**Rules for AI Agents**:

- ✅ **DO**: Design modules to scale independently via multiple app instances
- ✅ **DO**: Use resource-specific configurations per module
- ✅ **DO**: Consider caching and performance optimizations per module
- ❌ **DON'T**: Create shared resource bottlenecks between modules

**Code Examples**:

```typescript
// ✅ GOOD: Module-specific performance configuration
// packages/content/src/shared/content-shared.module.ts
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ContentConfig>) => ({
        connection: {
          host: configService.get('content.redis.host'),
          port: configService.get('content.redis.port'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: QUEUES.VIDEO_PROCESSING,
      processors: [{
        name: 'video-transcription',
        concurrency: 5,  // Content-specific scaling
      }],
    }),
  ],
})
export class ContentSharedModule {}

// ✅ GOOD: Separate scaling configuration in deployment
// docker-compose.yml
services:
  billing-api:
    image: billing-api:latest
    replicas: 3              # Scale based on billing load
    environment:
      - BILLING_DATABASE_POOL_SIZE=15  # Billing-specific DB tuning
      - CACHE_TTL=600                   # Billing-specific caching

  content-worker:
    image: content-worker:latest
    replicas: 5              # Different scaling for content processing
    environment:
      - CONTENT_DATABASE_POOL_SIZE=20  # Content-specific DB tuning
      - CONTENT_REDIS_POOL_SIZE=10     # Content-specific Redis tuning
```

### 5. Explicit Communication

**Definition**: All inter-module communication happens through well-defined contracts.

**Rules for AI Agents**:

- ✅ **DO**: Define clear interfaces for all module interactions
- ✅ **DO**: Use DTOs for data transfer between modules
- ✅ **DO**: Document all communication contracts
- ❌ **DON'T**: Access other modules' internal data structures
- ❌ **DON'T**: Make assumptions about other modules' implementations

**Code Examples**:

```typescript
// ✅ GOOD: Explicit interface contract
// packages/shared/src/interfaces/billing-subscription.interface.ts
export interface BillingSubscriptionStatusApi {
  isUserSubscriptionActive(userId: string): Promise<boolean>;
  getSubscriptionPlan(userId: string): Promise<SubscriptionPlan | null>;
  getUserSubscriptionDetails(userId: string): Promise<SubscriptionDetails[]>;
}

export interface SubscriptionPlan {
  planId: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
}

export interface SubscriptionDetails {
  subscriptionId: string;
  status: 'active' | 'cancelled' | 'expired';
  plan: SubscriptionPlan;
  expiresAt: Date;
}

// ✅ GOOD: Implementation respects the contract
// packages/billing/src/services/subscription.service.ts
@Injectable()
export class SubscriptionService implements BillingSubscriptionStatusApi {
  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    // Implementation details hidden
    const subscription = await this.repository.findActiveByUserId(userId);
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      plan: this.mapToSubscriptionPlan(subscription),
    };
  }
}

// ✅ GOOD: Consumer uses only the contract
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
      await this.httpClient.get<BillingApiUserSubscriptionActiveResponseDto>(url);
    return isActive;
  }
}

// ✅ GOOD: Queue-based communication with explicit payload
export interface VideoProcessingJobData {
  videoId: string;
  url: string;
  contentId: string;
  processingType: 'transcription' | 'summary' | 'age-rating';
  timestamp: Date;
}

export interface QueueProducer {
  addJob<T>(queueName: string, jobData: T): Promise<void>;
}

export interface QueueConsumer {
  process<T>(handler: (job: Job<T>) => Promise<void>): Promise<void>;
}

// Publisher
export class VideoProcessingJobProducer {
  constructor(private queueProducer: QueueProducer) {}

  async processVideo(videoId: string, url: string, contentId: string) {
    // Business logic...

    // Publish job with strong typing
    await this.queueProducer.addJob<VideoProcessingJobData>(QUEUES.VIDEO_PROCESSING, {
      videoId,
      url,
      contentId,
      processingType: 'transcription',
      timestamp: new Date(),
    });
  }
}

// Subscriber
export class VideoTranscriptionConsumer {
  constructor(private transcribeVideoUseCase: TranscribeVideoUseCase) {}

  async process(job: Job<VideoProcessingJobData>) {
    // Type-safe job handling
    const { videoId, url } = job.data;
    const video = await this.videoRepository.findOneById(videoId);

    if (video) {
      await this.transcribeVideoUseCase.generateTranscript(video);
    }
  }
}
```

### 6. Replaceability

**Definition**: Modules can be substituted without affecting other parts of the architecture.

**Rules for AI Agents**:

- ✅ **DO**: Design modules to be swappable behind interfaces
- ✅ **DO**: Avoid exposing implementation details
- ✅ **DO**: Use dependency injection for all module dependencies
- ❌ **DON'T**: Create hard dependencies on specific implementations
- ❌ **DON'T**: Export concrete classes as module APIs

**Code Examples**:

```typescript
// ✅ GOOD: Replaceable payment service design
// packages/shared/module/public-api/interface/payment.interface.ts
export interface PaymentServiceContract {
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  refundPayment(paymentId: string): Promise<RefundResult>;
}

// ✅ GOOD: Multiple implementations of the same interface
// packages/billing/src/public-api/facade/stripe-payment.facade.ts
@Injectable()
export class StripePaymentProvider implements PaymentServiceContract {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Stripe-specific implementation
  }
}

// packages/billing/src/public-api/facade/paypal-payment.facade.ts
@Injectable()
export class PayPalPaymentProvider implements PaymentServiceContract {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // PayPal-specific implementation
  }
}

// ✅ GOOD: Configurable service selection
// packages/content/src/video-processor/content-video-processor.module.ts
@Module({
  providers: [
    {
      provide: VideoSummaryGenerationAdapter,
      useFactory: (config: ConfigService): VideoSummaryGenerationAdapter => {
        const provider = config.get('VIDEO_PROCESSING_PROVIDER');
        switch (provider) {
          case 'gemini':
            return new GeminiTextExtractorClient();
          case 'openai':
            return new OpenAITextExtractorClient();
          default:
            throw new Error(`Unknown video processing provider: ${provider}`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [VideoSummaryGenerationAdapter],
})
export class ContentVideoProcessorModule {}

// ✅ GOOD: Consumer doesn't know about specific implementation
@Injectable()
export class GenerateSummaryForVideoUseCase {
  constructor(
    @Inject(VideoSummaryGenerationAdapter)
    private summaryGenerator: VideoSummaryGenerationAdapter // Interface only
  ) {}
}
```

### 7. Deployment Independence

**Definition**: Modules don't dictate how they're deployed - they can run as monolith or distributed services.

**Rules for AI Agents**:

- ✅ **DO**: Design modules to work in any deployment configuration
- ✅ **DO**: Use environment variables for deployment-specific config
- ✅ **DO**: Keep deployment logic in apps, not modules
- ❌ **DON'T**: Hard-code deployment assumptions in modules
- ❌ **DON'T**: Make modules aware of their deployment context

**Code Examples**:

```typescript
// ✅ GOOD: Module is deployment-agnostic
// packages/content/src/content.module.ts
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('CONTENT_DB_HOST'), // Environment-driven
        port: config.get('CONTENT_DB_PORT'),
        database: config.get('CONTENT_DB_NAME'),
        // Module doesn't care if this is local, RDS, or containerized
      }),
    }),
  ],
})
export class ContentModule {}

// ✅ GOOD: Multiple deployment strategies for same modules
// apps/monolith/src/monolith.module.ts (Everything together)
@Module({
  imports: [
    ContentModule,
    IdentityModule,
    ConfigModule.forRoot({
      load: [contentConfigFactory, identityConfigFactory],
    }),
  ],
})
export class MonolithModule {}

// apps/billing-api/src/billing-api.module.ts (Microservice)
@Module({
  imports: [
    BillingModule, // Same module, different deployment
    ConfigModule.forRoot({
      load: [billingConfigFactory],
    }),
  ],
})
export class BillingApiModule {}

// ✅ GOOD: Environment-specific configurations
// apps/billing-api/.env.production
BILLING_DATABASE_HOST = billing - db.prod.cluster;
BILLING_DATABASE_NAME = billing_prod;
BILLING_DATABASE_USERNAME = billing_user;

// apps/monolith/.env.production
CONTENT_DATABASE_HOST = content - db.prod.cluster;
CONTENT_DATABASE_NAME = content_prod;
IDENTITY_DATABASE_HOST = identity - db.prod.cluster;
```

### 8. State Isolation

**Definition**: Each module owns and manages its own state without sharing databases or state with other modules.

**Rules for AI Agents**:

- ✅ **DO**: Give each module its own database connection/schema
- ✅ **DO**: Make modules own their data migrations
- ✅ **DO**: Use events or APIs for cross-module data needs
- ❌ **DON'T**: Share database tables between modules
- ❌ **DON'T**: Access other modules' data directly
- ❌ **DON'T**: Create duplicate entities with same @Entity names

### ⚠️ Critical State Isolation Violations

#### ❌ FORBIDDEN: Duplicate Entity Names Across Modules

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

**Code Examples**:

```typescript
// ✅ GOOD: Module-specific database configuration
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

// ✅ GOOD: Cross-module data access via HTTP client
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

// ✅ GOOD: Using string references instead of foreign keys
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

// ❌ BAD: Accessing another module's database
@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(UserEntity, 'identity') // ❌ Wrong! This is from identity module
    private userRepository: Repository<UserEntity>
  ) {}
}
```

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

// ❌ BAD: Fat controller with business logic
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

### 9. Observability & Monitoring

**Definition**: Each module provides individual visibility into its health, performance, and behavior.

**Rules for AI Agents**:

- ✅ **DO**: Add module-specific logging, metrics, and health checks
- ✅ **DO**: Use consistent logging formats with module identifiers
- ✅ **DO**: Create module-specific dashboards and alerts
- ❌ **DON'T**: Mix module concerns in logging and monitoring
- ❌ **DON'T**: Rely only on application-level monitoring

**Code Examples**:

```typescript
// ✅ GOOD: Module-specific logger
// packages/content/src/admin/core/service/content-management.service.ts
@Injectable()
export class ContentManagementService {
  private readonly logger = new Logger('ContentManagementService');

  async publishContent(contentId: string, publishedBy: string) {
    this.logger.log(`Publishing content ${contentId} by ${publishedBy}`, {
      module: 'content',
      operation: 'content_publish',
      contentId,
      publishedBy,
      timestamp: new Date().toISOString(),
    });

    try {
      await this.repository.publishContent(contentId, publishedBy);

      this.logger.log(`Content published successfully: ${contentId}`, {
        module: 'content',
        operation: 'content_publish_success',
        contentId,
        publishedBy,
      });
    } catch (error) {
      this.logger.error(`Failed to publish content ${contentId}`, error, {
        module: 'content',
        operation: 'content_publish_error',
        contentId,
        publishedBy,
        error: error.message,
      });
      throw error;
    }
  }
}

// ✅ GOOD: Module-specific health check
// packages/billing/src/health/billing.health.ts
@Injectable()
export class BillingHealthIndicator extends HealthIndicator {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check database connectivity
      await this.subscriptionRepository.query('SELECT 1');

      // Check critical business logic
      const activeSubscriptions = await this.subscriptionRepository.count({
        where: { status: SubscriptionStatus.Active },
      });

      return this.getStatus(key, true, {
        message: 'Billing module is healthy',
        activeSubscriptions,
        dbConnection: 'ok',
      });
    } catch (error) {
      return this.getStatus(key, false, {
        message: 'Billing module is unhealthy',
        error: error.message,
      });
    }
  }
}

// ✅ GOOD: Module-specific metrics
// packages/billing/src/services/subscription.service.ts
@Injectable()
export class SubscriptionService {
  private subscriptionCreateCounter = new Counter({
    name: 'billing_subscription_creates_total',
    help: 'Total number of subscription creates',
    labelNames: ['plan_type', 'status'],
  });

  private subscriptionCreateDuration = new Histogram({
    name: 'billing_subscription_create_duration_seconds',
    help: 'Duration of subscription create operations',
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  async createSubscription({ planId }: { planId: string }): Promise<Subscription> {
    const endTimer = this.subscriptionCreateDuration.startTimer();

    try {
      const subscription = await this.repository.createSubscription(planId);

      this.subscriptionCreateCounter
        .labels({ plan_type: 'premium', status: 'active' })
        .inc();
      return subscription;
    } finally {
      endTimer();
    }
  }
}
```

### 10. Fail Independence

**Definition**: Failures in one module don't cascade to other modules, maintaining system resilience.

**Rules for AI Agents**:

- ✅ **DO**: Implement circuit breakers for inter-module communication
- ✅ **DO**: Design graceful degradation when dependencies fail
- ✅ **DO**: Use timeouts and retries for external calls
- ❌ **DON'T**: Let one module's failure bring down others
- ❌ **DON'T**: Create synchronous dependencies that can cascade failures

**Code Examples**:

```typescript
// ✅ GOOD: Circuit breaker for external service calls
// packages/content/src/admin/http/client/external-movie-rating/external-movie-rating.client.ts
import CircuitBreaker from 'opossum';

@Injectable()
export class ExternalMovieRatingClient {
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker(this.callMovieRatingService.bind(this), {
      timeout: 3000, // 3 second timeout
      errorThresholdPercentage: 50, // Open after 50% failure rate
      resetTimeout: 30000, // Try again after 30 seconds
    });

    this.circuitBreaker.fallback(() => ({
      rating: null,
      message: 'Movie rating service temporarily unavailable',
    }));
  }

  async getMovieRating(movieTitle: string): Promise<ExternalMovieRating> {
    try {
      return await this.circuitBreaker.fire(movieTitle);
    } catch (error) {
      // Graceful degradation
      return {
        rating: null,
        source: 'fallback',
        message: 'Unable to fetch movie rating, using default',
      };
    }
  }

  private async callMovieRatingService(movieTitle: string): Promise<ExternalMovieRating> {
    // Actual HTTP call to movie rating service
  }
}

// ✅ GOOD: Async communication with failure handling
// packages/content/src/admin/queue/producer/video-processing-job.queue-producer.ts
@Injectable()
export class VideoProcessingJobProducer {
  constructor(private queueService: QueueService, private logger: Logger) {}

  async processVideo(videoId: string, url: string) {
    // Core video operation (always works)
    await this.videoRepository.markAsProcessing(videoId);

    // Non-critical operations that can fail independently
    try {
      // Add job to queue with retry mechanism
      await this.queueService.addJob(QUEUES.VIDEO_PROCESSING, {
        videoId,
        url,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.warn('Failed to queue video processing job', error);
      // Don't fail the main operation - queue system handles retries
    }

    // Optional external movie rating with graceful degradation
    try {
      const movieRating = await this.movieRatingClient.getMovieRating(videoTitle);
      if (movieRating.rating) {
        await this.updateMovieRating(videoId, movieRating.rating);
      }
    } catch (error) {
      this.logger.warn('Movie rating fetch failed, continuing without rating', error);
      // Continue without rating rather than failing
    }
  }
}

// ✅ GOOD: Timeout and retry configuration
// packages/billing/src/public-api/facade/payment-gateway.facade.ts
@Injectable()
export class PaymentGatewayProvider {
  constructor(private httpService: HttpService) {}

  async processPayment(paymentData: any): Promise<any> {
    const retryConfig = {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          error.response?.status >= 500
        );
      },
    };

    try {
      const response = await this.httpService.axiosRef.request({
        url: '/payment-gateway/process',
        method: 'POST',
        data: paymentData,
        timeout: 5000, // 5 second timeout
        ...retryConfig,
      });

      return response.data;
    } catch (error) {
      this.logger.error('External service call failed after retries', error);

      // Return default/cached data instead of failing
      return this.getFallbackData();
    }
  }

  private getFallbackData() {
    return { status: 'degraded', data: null };
  }
}

// ✅ GOOD: Health check that doesn't cascade failures
// packages/content/src/content-health.indicator.ts
@Injectable()
export class ContentHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkExternalDependencies(),
      this.checkBusinessLogic(),
    ]);

    const dbStatus = checks[0].status === 'fulfilled';
    const externalStatus = checks[1].status === 'fulfilled';
    const businessStatus = checks[2].status === 'fulfilled';

    // Module is healthy if core functionality works
    // External dependencies can be degraded without affecting health
    const isHealthy = dbStatus && businessStatus;

    return this.getStatus(key, isHealthy, {
      database: dbStatus ? 'ok' : 'failed',
      external: externalStatus ? 'ok' : 'degraded',
      business: businessStatus ? 'ok' : 'failed',
      // Module can operate with degraded external services
      canOperate: dbStatus && businessStatus,
    });
  }
}
```

#### Detection Commands for AI Agents

**CRITICAL**: Run these commands before completing any State Isolation analysis:

```bash
# 1. Check for duplicate entity names (MOST IMPORTANT)
grep -r "@Entity.*name:" packages/ | \
  grep -o "name: '[^']*'" | sort | uniq -d

# 2. Show which modules have duplicate entities
grep -r "@Entity.*name:" packages/ | \
  sed 's/.*packages\/\([^/]*\)\/.*@Entity.*name: *['\''"]\([^'\''"]*\)['\''"].*/\1:\2/' | \
  sort | awk -F: '{if($2==prev){print "❌ DUPLICATE: " $2 " in " prevmod " and " $1} prevmod=$1; prev=$2}'

# 3. Check for identical entity file contents
find packages/ -name "*.entity.ts" -exec basename {} \; | \
  sort | uniq -d | xargs -I {} find packages/ -name {} -exec md5sum {} \;
```

**If ANY duplicates are found, State Isolation is VIOLATED.**

### Entity Naming Conventions

**Rule**: Entity names MUST be prefixed with module name or use module-specific terminology:

- `BillingPlan`, `BillingSubscription` (billing module)
- `ContentItem`, `ContentVideo` (content module)
- `IdentityUser`, `IdentityProfile` (identity module)

**Never use generic names** like `Plan`, `User`, `Item` across modules.

## Implementation Guidelines for AI Agents

### State Isolation Verification Checklist

**MANDATORY**: Every AI agent MUST run this checklist before claiming State Isolation compliance:

#### Step 1: Duplicate Entity Detection (CRITICAL)

```bash
# Check for duplicate @Entity names - MOST IMPORTANT CHECK
DUPLICATES=$(grep -r "@Entity.*name:" packages/ | grep -o "name: '[^']*'" | sort | uniq -d)
if [ ! -z "$DUPLICATES" ]; then
  echo "❌ CRITICAL VIOLATION: Duplicate entities found"
  exit 1
fi
```

#### Step 2: Cross-Module Import Detection

```bash
# Check for cross-module entity imports
grep -r "from.*@tlc.*/.*entity" packages/ | grep -v shared
```

#### Step 3: Shared Configuration Detection

```bash
# Check for shared database configurations
grep -r "host.*database.*username" packages/ | \
  grep -v "process.env.*_DATABASE_" | head -5
```

**FAILURE CRITERIA**: If Step 1 finds ANY duplicates, State Isolation is VIOLATED regardless of other checks.

### When Adding New Features

1. **Identify the Correct Module**: Determine which domain the feature belongs to
2. **Check Boundaries**: Ensure the feature doesn't violate module boundaries
3. **Design Communication**: If cross-module interaction is needed, design explicit contracts
4. **Implement Resilience**: Add appropriate error handling and fallbacks
5. **Add Observability**: Include logging, metrics, and health checks
6. **Verify State Isolation**: Run duplicate entity detection commands
7. **Test Independence**: Ensure the feature can be tested in isolation

### When Refactoring Existing Code

1. **Preserve Boundaries**: Don't break existing module boundaries
2. **Maintain Contracts**: Keep existing interfaces stable
3. **Update Documentation**: Reflect changes in module contracts
4. **Test Thoroughly**: Ensure changes don't break module independence

### Common Anti-Patterns to Avoid

1. **Shared Database Access**: Never access another module's database directly
2. **Direct Class Dependencies**: Use interfaces and dependency injection
3. **Synchronous Cross-Module Calls**: Prefer async communication when possible
4. **Global State**: Avoid shared mutable state between modules
5. **Tight Coupling**: Don't create hard dependencies between modules
6. **Duplicate Entity Names**: Never use same @Entity names across modules
7. **Exported Internal Services**: Don't export domain services in index.ts
8. **Horizontal Layering Inside Packages**: Organizing by technical layers (controllers/, services/, repositories/) instead of features (subscription/, invoice/). See [FEATURE-FOLDERS.md](./FEATURE-FOLDERS.md) for correct vertical slice organization

### File Organization Patterns

For detailed guidelines on organizing code within packages, see **[FEATURE-FOLDERS.md](./FEATURE-FOLDERS.md)**.

#### Quick Summary

Our codebase follows a **3-level hierarchy**:

1. **Package** (Bounded Context): `billing/`, `content/`, `identity/`
2. **Module** (Sub-domain, optional): `content/admin/`, `content/catalog/`
3. **Feature** (Vertical Slice): `billing/subscription/`, `content/admin/movie/`

Each **feature** is a complete vertical slice containing:

```
feature-name/
├── core/          # Business logic (services, use-cases)
├── http/          # API layer (controllers, DTOs, clients)
├── persistence/   # Data access (entities, repositories)
├── queue/         # Async processing (consumers, producers) [if needed]
└── __test__/      # Tests (e2e, unit)
```

#### When to Use Each Level

| Level | Purpose | Examples | When to Create |
|-------|---------|----------|----------------|
| **Package** | DDD Bounded Context | `billing`, `content`, `identity` | Different databases, teams, domains |
| **Module** | Sub-domain separation | `content/admin`, `content/catalog` | Logical grouping within package |
| **Feature** | Business capability | `subscription`, `invoice`, `movie` | Individual user-facing feature |

#### Real Examples from Codebase

```
packages/
├── billing/                    # Package (Bounded Context)
│   ├── subscription/           # Feature (Vertical Slice)
│   │   ├── core/
│   │   ├── http/
│   │   ├── persistence/
│   │   └── __test__/
│   ├── invoice/                # Feature (Vertical Slice)
│   └── shared/                 # Infrastructure only
│
├── content/                    # Package (Bounded Context)
│   ├── admin/                  # Module (Sub-domain)
│   │   ├── movie/              # Feature (Vertical Slice)
│   │   ├── tv-show/            # Feature (Vertical Slice)
│   │   └── age-recommendation/ # Feature (Vertical Slice)
│   ├── catalog/                # Module (Sub-domain)
│   │   ├── player/             # Feature (Vertical Slice)
│   │   └── content-listing/    # Feature (Vertical Slice)
│   └── shared/                 # Infrastructure only
│
└── identity/                   # Package (Bounded Context)
    ├── authentication/         # Feature (Vertical Slice)
    ├── user/                   # Feature (Vertical Slice)
    └── shared/                 # Infrastructure only
```

**For detailed guidelines**, including:
- Decision tree: when to create a new feature
- Cohesion criteria with real examples
- Shared folder rules (when to use `shared/`)
- Implementation checklist
- Anti-patterns to avoid

See **[FEATURE-FOLDERS.md](./FEATURE-FOLDERS.md)**.

## Recommended Event System Implementations

For production use, replace the abstract `EventPublisher` and `EventSubscriber` interfaces with reliable implementations:

### For Local Development/Testing

```typescript
// Simple in-memory implementation for development
@Injectable()
export class InMemoryEventPublisher implements EventPublisher {
  constructor(private eventBus: any) {} // Could be a simple pub/sub

  async publish<T>(eventName: string, payload: T): Promise<void> {
    this.eventBus.emit(eventName, payload);
  }
}
```

### For Production

```typescript
// Kafka implementation for production
@Injectable()
export class KafkaEventPublisher implements EventPublisher {
  constructor(private kafkaProducer: Producer) {}

  async publish<T>(eventName: string, payload: T): Promise<void> {
    await this.kafkaProducer.send({
      topic: this.getTopicName(eventName),
      messages: [
        {
          key: eventName,
          value: JSON.stringify(payload),
          headers: {
            eventType: eventName,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    });
  }

  private getTopicName(eventName: string): string {
    return `events.${eventName.replace('.', '-')}`;
  }
}

// AWS SQS implementation for simpler use cases
@Injectable()
export class SQSEventPublisher implements EventPublisher {
  constructor(private sqsClient: SQSClient) {}

  async publish<T>(eventName: string, payload: T): Promise<void> {
    await this.sqsClient.sendMessage({
      QueueUrl: this.getQueueUrl(eventName),
      MessageBody: JSON.stringify(payload),
      MessageAttributes: {
        eventType: { StringValue: eventName, DataType: 'String' },
      },
    });
  }
}

// Redis implementation for high-throughput scenarios
@Injectable()
export class RedisEventPublisher implements EventPublisher {
  constructor(private redisClient: Redis) {}

  async publish<T>(eventName: string, payload: T): Promise<void> {
    await this.redisClient.publish(eventName, JSON.stringify(payload));
  }
}
```

### Why Abstract Event Systems?

- **Reliability**: Kafka/SQS provide durability, retries, and dead letter topics/queues
- **Scalability**: Can handle high message volumes across distributed systems
- **Observability**: Built-in monitoring and tracing capabilities
- **Testability**: Easy to mock and test event flows
- **Replaceability**: Can swap implementations based on requirements
- **Event Sourcing**: Kafka provides event log capabilities for audit trails

### Choosing the Right Implementation

- **Kafka**: Best for high-throughput, event sourcing, and complex event processing
- **SQS**: Simple queue-based messaging with AWS ecosystem integration
- **Redis**: Fast in-memory pub/sub for real-time scenarios
- **RabbitMQ**: Feature-rich messaging with routing capabilities

Always prefer proven message queue systems over Node.js EventEmitter for inter-module communication in production environments.

## Automated State Isolation Detection

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
