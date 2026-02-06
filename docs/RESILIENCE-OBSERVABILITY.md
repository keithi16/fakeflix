# Resilience & Observability (Principles 9-10)

This document covers building resilient and observable systems through proper monitoring, logging, and failure isolation.

> **Navigation**: Return to [ARCHITECTURE-OVERVIEW.md](./ARCHITECTURE-OVERVIEW.md) | See also [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md) | [CODING-PATTERNS.md](./CODING-PATTERNS.md)

## Quick Reference (For LLMs)

**When to use this doc**: Adding logging, monitoring, error handling, or circuit breakers

**Key rules**:

- ✅ DO: Add module-specific logging, metrics, and health checks
- ✅ DO: Use circuit breakers for external service calls
- ✅ DO: Implement timeouts and retries with exponential backoff
- ❌ DON'T: Mix module concerns in logging/monitoring
- ❌ DON'T: Let failures cascade between modules

**Detection**: See [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md#detection-commands) for detection commands

**See also**:

- [THIRD-PARTY-INTEGRATION.md](./THIRD-PARTY-INTEGRATION.md) - External API integration patterns
- [CODING-PATTERNS.md](./CODING-PATTERNS.md) - Service implementation patterns
- [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md) - Verification steps

## When to Read This Document

**Read this document when:**

- [ ] Adding logging to services
- [ ] Implementing metrics and monitoring
- [ ] Adding health checks
- [ ] Implementing circuit breakers
- [ ] Handling failures and graceful degradation
- [ ] Setting up observability dashboards

**Skip this document if:**

- You're only creating entities/repositories (see [STATE-ISOLATION.md](./STATE-ISOLATION.md) and [CODING-PATTERNS.md](./CODING-PATTERNS.md))
- You're only integrating external APIs (see [THIRD-PARTY-INTEGRATION.md](./THIRD-PARTY-INTEGRATION.md))
- You're only designing module boundaries (see [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md))

## Table of Contents

- [Observability & Monitoring](#observability--monitoring)
- [Fail Independence](#fail-independence)
- [Recommended Event System Implementations](#recommended-event-system-implementations)

---

## Observability & Monitoring

### Definition

Each module provides individual visibility into its health, performance, and behavior.

### Rules for AI Agents

- ✅ **DO**: Add module-specific logging, metrics, and health checks
- ✅ **DO**: Use consistent logging formats with module identifiers
- ✅ **DO**: Create module-specific dashboards and alerts
- ❌ **DON'T**: Mix module concerns in logging and monitoring
- ❌ **DON'T**: Rely only on application-level monitoring

### Code Examples

#### Module-Specific Logger

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
```

#### Module-Specific Health Check

```typescript
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
```

#### Module-Specific Metrics

```typescript
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

---

## Fail Independence

### Definition

Failures in one module don't cascade to other modules, maintaining system resilience.

### Rules for AI Agents

- ✅ **DO**: Implement circuit breakers for inter-module communication
- ✅ **DO**: Design graceful degradation when dependencies fail
- ✅ **DO**: Use timeouts and retries for external calls
- ❌ **DON'T**: Let one module's failure bring down others
- ❌ **DON'T**: Create synchronous dependencies that can cascade failures

### Code Examples

#### Circuit Breaker for External Service Calls

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
```

#### Async Communication with Failure Handling

```typescript
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
```

#### Timeout and Retry Configuration

```typescript
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
```

#### Health Check That Doesn't Cascade Failures

```typescript
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

---

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

#### Kafka Implementation

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
```

#### AWS SQS Implementation

```typescript
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
```

#### Redis Implementation

```typescript
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

| Implementation | Best For                                                  | Pros                                  | Cons                                |
| -------------- | --------------------------------------------------------- | ------------------------------------- | ----------------------------------- |
| **Kafka**      | High-throughput, event sourcing, complex event processing | Durable, scalable, event log          | Complex setup, operational overhead |
| **SQS**        | Simple queue-based messaging with AWS ecosystem           | Easy setup, managed service, reliable | AWS-specific, limited routing       |
| **Redis**      | Fast in-memory pub/sub for real-time scenarios            | Very fast, simple, low latency        | No persistence, limited durability  |
| **RabbitMQ**   | Feature-rich messaging with routing capabilities          | Flexible routing, mature ecosystem    | More complex than SQS               |

**Always prefer proven message queue systems over Node.js EventEmitter for inter-module communication in production environments.**

---

## Patterns Summary

### Observability Best Practices

1. **Structured Logging**

   - Use consistent log formats with module identifiers
   - Include correlation IDs for request tracing
   - Log at appropriate levels (debug, info, warn, error)

2. **Metrics Collection**

   - Track business metrics (subscriptions created, videos processed)
   - Monitor technical metrics (response times, error rates)
   - Use histograms for latency tracking

3. **Health Checks**

   - Check database connectivity
   - Verify critical business logic
   - Monitor external dependencies
   - Return detailed status information

4. **Distributed Tracing**
   - Use correlation IDs across services
   - Track requests through multiple modules
   - Identify performance bottlenecks

### Resilience Best Practices

1. **Circuit Breakers**

   - Protect against cascading failures
   - Implement fallback mechanisms
   - Monitor circuit state transitions

2. **Timeouts**

   - Set reasonable timeout values
   - Don't wait indefinitely for responses
   - Consider system-wide SLAs

3. **Retries**

   - Use exponential backoff
   - Limit retry attempts
   - Only retry idempotent operations

4. **Graceful Degradation**

   - Identify critical vs. optional features
   - Continue core operations when non-critical services fail
   - Provide reduced functionality rather than complete failure

5. **Bulkheads**
   - Isolate resource pools per module
   - Prevent resource exhaustion in one module affecting others
   - Use separate thread pools, connection pools, etc.

---

## Monitoring Checklist

When implementing observability and resilience:

- [ ] Module has structured logging with module identifier
- [ ] Critical operations emit metrics (counters, histograms)
- [ ] Health check endpoint implemented
- [ ] External service calls have circuit breakers
- [ ] All network calls have timeouts
- [ ] Retry logic uses exponential backoff
- [ ] Graceful degradation for non-critical features
- [ ] Health checks use `Promise.allSettled()` to avoid cascading failures
- [ ] Correlation IDs propagated across service calls
- [ ] Alerts configured for critical metrics

---

## Detection Commands

**See [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md#detection-commands) for all detection commands.**

**Quick checks for observability**:

```bash
# Services without logging
find packages/*/core/service -name "*.service.ts" -exec grep -L "Logger" {} \;

# Check for circuit breaker usage
grep -r "CircuitBreaker" packages/
```

---

## Summary

### Principles 9-10 Checklist

**Observability (Principle 9)**:

- [ ] Module-specific logger implemented
- [ ] Business and technical metrics tracked
- [ ] Health check endpoint available
- [ ] Structured logging with correlation IDs

**Fail Independence (Principle 10)**:

- [ ] Circuit breakers for external services
- [ ] Timeouts on all network calls
- [ ] Retry logic with exponential backoff
- [ ] Graceful degradation implemented
- [ ] Health checks don't cascade failures

---

## Next Steps

- **Coding Patterns**: See [CODING-PATTERNS.md](./CODING-PATTERNS.md) for implementation patterns
- **State Isolation**: See [STATE-ISOLATION.md](./STATE-ISOLATION.md) for database guidelines
- **Implementation**: See [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md) for verification steps

---

**Last Updated**: January 2026  
**Maintained By**: Architecture Team
