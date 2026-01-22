# Modular Architecture Principles (1-7)

This document provides detailed guidelines for the first 7 principles of modular architecture, focusing on module boundaries, interactions, and composition.

> **Navigation**: Return to [ARCHITECTURE-OVERVIEW.md](./ARCHITECTURE-OVERVIEW.md) | See also [STATE-ISOLATION.md](./STATE-ISOLATION.md) (Principle 8) | [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md) (Principles 9-10)

## Table of Contents

- [1. Well-Defined Boundaries](#1-well-defined-boundaries)
- [2. Composability](#2-composability)
- [3. Independence](#3-independence)
- [4. Individual Scale](#4-individual-scale)
- [5. Explicit Communication](#5-explicit-communication)
- [6. Replaceability](#6-replaceability)
- [7. Deployment Independence](#7-deployment-independence)

---

## 1. Well-Defined Boundaries

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

---

## 2. Composability

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

---

## 3. Independence

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

---

## 4. Individual Scale

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

---

## 5. Explicit Communication

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

---

## 6. Replaceability

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

---

## 7. Deployment Independence

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

---

## Summary: Principles 1-7 Checklist

When designing or reviewing modules, ensure:

- [ ] **Boundaries** are well-defined with clear exports
- [ ] **Composition** is possible - module works alone or with others
- [ ] **Independence** is maintained - no shared mutable state
- [ ] **Scaling** can happen per-module with specific configs
- [ ] **Communication** uses explicit interfaces and DTOs
- [ ] **Replacement** is possible via dependency injection
- [ ] **Deployment** flexibility via environment configuration

## Next Steps

- **Principle 8 (State Isolation)**: See [STATE-ISOLATION.md](./STATE-ISOLATION.md)
- **Principles 9-10 (Observability & Resilience)**: See [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md)
- **Implementation Patterns**: See [CODING-PATTERNS.md](./CODING-PATTERNS.md)
- **Verification Checklist**: See [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md)

---

**Last Updated**: January 2026  
**Maintained By**: Architecture Team
