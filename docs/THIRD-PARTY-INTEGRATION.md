# Third-Party Integration Documentation

Patterns and best practices for integrating external APIs and services.

> **Navigation**: Return to [ARCHITECTURE-OVERVIEW.md](./ARCHITECTURE-OVERVIEW.md) | See also [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md) | [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md)

## Table of Contents

- [Integration Patterns](#integration-patterns)
- [Client Encapsulation](#client-encapsulation)
- [Injection Patterns](#injection-patterns)
- [Implementation Checklist](#implementation-checklist)
- [Code Examples](#code-examples)
- [Anti-Patterns](#anti-patterns)

---

## Integration Patterns

### Pattern 1: Mock Client

**When**: Development, testing, or when external service unavailable

```typescript
@Injectable()
export class PaymentGatewayClient {
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    await this.simulateLatency(); // 100-300ms
    
    if (Math.random() < 0.10) { // 10% failure rate
      return { success: false, failureReason: 'Card declined' };
    }
    
    return {
      success: true,
      transactionId: `PAY-${Date.now()}`,
      processedAt: new Date(),
    };
  }
}
```

### Pattern 2: HTTP Client

**When**: Production REST API integrations

```typescript
@Injectable()
export class ExternalRatingClient {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpClient: HttpClient, // Shared HttpClient
  ) {}

  async getRating(title: string): Promise<number | undefined> {
    const apiToken = this.configService.get('api.token');
    const apiUrl = this.configService.get('api.url');
    
    try {
      const response = await this.httpClient.get(`${apiUrl}/rating/${title}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
        timeout: 5000,
      });
      return response.rating;
    } catch (error) {
      throw new HttpClientException(`Rating API error: ${error}`);
    }
  }
}
```

### Pattern 3: SDK Client

**When**: Vendor provides official SDK

```typescript
@Injectable()
export class GeminiClient implements VideoSummaryAdapter {
  constructor(private readonly configService: ConfigService) {}

  async generateSummary(videoUrl: string): Promise<string> {
    const ai = new GoogleGenAI({
      apiKey: this.configService.get('gemini.apiKey'),
    });
    
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [/* ... */],
    });
    
    return result.text;
  }
}
```

---

## Client Encapsulation

**CORE PRINCIPLE**: Client owns ALL HTTP/API details. Services only know business operations.

**Client owns**:

- ✅ URLs and endpoints
- ✅ Authentication (headers, tokens)
- ✅ Request/response mapping
- ✅ Error handling
- ✅ Timeouts and retries

**Service knows**:

- ✅ Business operations only
- ❌ NO HTTP details
- ❌ NO API URLs
- ❌ NO authentication

```typescript
// ✅ GOOD: Client encapsulates everything
@Injectable()
export class PaymentGatewayClient {
  async processPayment(data: PaymentRequest): Promise<PaymentResponse> {
    // ALL HTTP details here
    const url = `${this.baseUrl}/v1/charges`;
    const headers = { Authorization: `Bearer ${this.apiKey}` };
    const apiRequest = this.mapToApiFormat(data);
    
    const response = await this.httpClient.post(url, apiRequest, { headers });
    return this.mapFromApiFormat(response);
  }
}

// ✅ GOOD: Service only knows business operations
@Injectable()
export class PaymentService {
  constructor(private readonly paymentClient: PaymentGatewayClient) {}
  
  async processPayment(invoice: Invoice): Promise<Payment> {
    // No HTTP details - just business logic
    const response = await this.paymentClient.processPayment({
      amount: invoice.totalAmount,
      invoiceId: invoice.id,
    });
    
    return this.paymentRepository.save(new Payment({
      transactionId: response.transactionId,
      amount: invoice.totalAmount,
    }));
  }
}
```

---

## Injection Patterns

### Default: Direct Injection (Most Common)

**Use when**: Single provider, no plans to replace

```typescript
@Injectable()
export class TaxService {
  constructor(
    private readonly easyTaxClient: EasyTaxClient, // Direct injection
  ) {}
}
```

### Interface Pattern: Only When Replaceability Needed

**Use when**: Multiple providers possible (e.g., Gemini vs OpenAI)

```typescript
// Interface
export interface VideoSummaryAdapter {
  generateSummary(videoUrl: string): Promise<string>;
}
export const VideoSummaryAdapter = Symbol('VideoSummaryAdapter');

// Client implements interface
@Injectable()
export class GeminiClient implements VideoSummaryAdapter {
  async generateSummary(videoUrl: string): Promise<string> { /* ... */ }
}

// Module provides implementation
@Module({
  providers: [
    {
      provide: VideoSummaryAdapter,
      useClass: GeminiClient, // Can swap to OpenAIClient
    },
  ],
})
export class VideoProcessorModule {}

// Service uses interface
@Injectable()
export class SummaryUseCase {
  constructor(
    @Inject(VideoSummaryAdapter)
    private readonly adapter: VideoSummaryAdapter, // Interface
  ) {}
}
```

---

## Implementation Checklist

### Setup

- [ ] Choose pattern (mock, HTTP, SDK)
- [ ] Create client class
- [ ] Encapsulate ALL HTTP/API details in client
- [ ] Add configuration (API keys, URLs) via ConfigService
- [ ] **Default**: Direct injection (NO interface)
- [ ] **Only if needed**: Interface for replaceability

### Resilience

- [ ] Timeout configuration (5-30 seconds)
- [ ] Retry logic (3 retries, exponential backoff)
- [ ] Circuit breaker (recommend `opossum`)
- [ ] Graceful degradation for failures
- [ ] Error handling (don't cascade failures)

### Observability

- [ ] Structured logging (sanitize sensitive data)
- [ ] Log request/response (no API keys, tokens)
- [ ] Track metrics (latency, success rates)
- [ ] Include correlation IDs

### Security

- [ ] Environment variables for API keys (never hardcode)
- [ ] Use ConfigService for credentials
- [ ] Sanitize logs (no sensitive data)
- [ ] Validate SSL certificates

---

## Code Examples

### Example 1: Mock Client (Direct Injection)

```typescript
@Injectable()
export class EasyTaxClient {
  constructor(private readonly logger: AppLogger) {}

  async createTransaction(request: TaxRequest): Promise<TaxResponse> {
    await this.simulateLatency();
    
    if (Math.random() < 0.05) {
      throw new Error('EasyTax API error');
    }
    
    return {
      totalTax: request.amount * 0.08,
      transactionId: `EASY-${Date.now()}`,
    };
  }
  
  private async simulateLatency(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  }
}

// Service uses directly
@Injectable()
export class TaxService {
  constructor(private readonly easyTaxClient: EasyTaxClient) {}
  
  async calculateTax(amount: number): Promise<number> {
    const response = await this.easyTaxClient.createTransaction({ amount });
    return response.totalTax;
  }
}
```

### Example 2: HTTP Client with Circuit Breaker

```typescript
import CircuitBreaker from 'opossum';

@Injectable()
export class ExternalRatingClient {
  private circuitBreaker: CircuitBreaker;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly configService: ConfigService,
  ) {
    this.circuitBreaker = new CircuitBreaker(
      this.callApi.bind(this),
      {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      }
    );
    
    this.circuitBreaker.fallback(() => ({ rating: null }));
  }

  async getRating(title: string): Promise<number | undefined> {
    try {
      const result = await this.circuitBreaker.fire(title);
      return result.rating;
    } catch (error) {
      this.logger.warn('Rating API failed, using default');
      return undefined; // Graceful degradation
    }
  }

  private async callApi(title: string): Promise<{ rating: number }> {
    const url = `${this.configService.get('api.url')}/rating/${title}`;
    const token = this.configService.get('api.token');
    
    return this.httpClient.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
  }
}
```

### Example 3: SDK Client with Interface

```typescript
// Interface for replaceability
export interface VideoSummaryAdapter {
  generateSummary(videoUrl: string): Promise<string>;
}
export const VideoSummaryAdapter = Symbol('VideoSummaryAdapter');

// SDK client
@Injectable()
export class GeminiClient implements VideoSummaryAdapter {
  constructor(private readonly configService: ConfigService) {}

  async generateSummary(videoUrl: string): Promise<string> {
    const ai = new GoogleGenAI({
      apiKey: this.configService.get('gemini.apiKey'),
    });
    
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [/* ... */],
    });
    
    return result.text || '';
  }
}

// Module
@Module({
  providers: [
    {
      provide: VideoSummaryAdapter,
      useClass: GeminiClient, // Can swap to OpenAIClient
    },
  ],
})
export class VideoProcessorModule {}

// Use case
@Injectable()
export class GenerateSummaryUseCase {
  constructor(
    @Inject(VideoSummaryAdapter)
    private readonly adapter: VideoSummaryAdapter,
  ) {}
  
  async execute(video: Video): Promise<void> {
    const summary = await this.adapter.generateSummary(video.url);
    // Save summary...
  }
}
```

---

## Anti-Patterns

### ❌ DON'T: Hardcode API Keys

```typescript
// ❌ BAD
private readonly apiKey = 'sk_live_1234567890';

// ✅ GOOD
constructor(private readonly configService: ConfigService) {}
private getApiKey() {
  return this.configService.get('api.key');
}
```

### ❌ DON'T: Expose HTTP Details to Services

```typescript
// ❌ BAD: Service knows HTTP details
async processPayment(invoice: Invoice) {
  const url = 'https://api.stripe.com/v1/charges';
  const headers = { Authorization: `Bearer ${this.apiKey}` };
  const response = await axios.post(url, data, { headers });
}

// ✅ GOOD: Client encapsulates HTTP
async processPayment(invoice: Invoice) {
  const response = await this.paymentClient.processPayment({
    amount: invoice.totalAmount,
  });
}
```

### ❌ DON'T: Let Failures Cascade

```typescript
// ❌ BAD: Failure cascades
async processInvoice(invoice: Invoice) {
  const tax = await this.taxClient.calculateTax(invoice); // If fails, whole fails
  const payment = await this.paymentClient.processPayment(invoice);
}

// ✅ GOOD: Graceful degradation
async processInvoice(invoice: Invoice) {
  let tax = 0;
  try {
    const taxResponse = await this.taxClient.calculateTax(invoice);
    tax = taxResponse.totalTax;
  } catch (error) {
    this.logger.warn('Tax calculation failed, using default');
    tax = this.calculateDefaultTax(invoice); // Fallback
  }
  
  // Continue even if tax failed
  const payment = await this.paymentClient.processPayment(invoice);
}
```

### ❌ DON'T: Share Clients Across Modules

```typescript
// ❌ BAD: Exporting client
@Module({ exports: [EasyTaxClient] })
export class BillingModule {}

// ❌ BAD: Importing client from another module
import { EasyTaxClient } from '@billing/http/client/easytax-api/easytax-tax.client';

// ✅ GOOD: Use module facade
import { BillingFacade } from '@billing/public-api/facade/billing.facade';
```

### ❌ DON'T: Log Sensitive Data

```typescript
// ❌ BAD
this.logger.log('API call', {
  apiKey: this.apiKey, // NEVER
  cardNumber: payment.cardNumber, // NEVER
});

// ✅ GOOD: Sanitize
this.logger.log('API call', {
  invoiceId: payment.invoiceId,
  amount: payment.amount,
  // Don't log sensitive fields
});
```

### ✅ DO: Use Timeouts

```typescript
// ✅ GOOD
const response = await this.httpClient.get(url, {
  timeout: 10000, // 10 seconds
});
```

### ✅ DO: Implement Circuit Breakers

```typescript
// ✅ GOOD
this.circuitBreaker = new CircuitBreaker(this.callApi.bind(this), {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});
```

---

## Shared HttpClient Usage

### HttpClient Setup

```typescript
// 1. Import HttpClientModule
@Module({
  imports: [HttpClientModule],
})
export class BillingModule {}

// 2. Inject HttpClient
@Injectable()
export class PaymentClient {
  constructor(private readonly httpClient: HttpClient) {}
  
  async processPayment(data: PaymentRequest) {
    return this.httpClient.post(url, data, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
  }
}
```

### Error Handling

```typescript
import { HttpClientException } from '@tlc/shared-module/http-client';

try {
  const response = await this.httpClient.get(url, options);
} catch (error) {
  if (error instanceof HttpClientException) {
    this.logger.error('HTTP client error', error);
  }
  throw error;
}
```

---

## Detection Commands

```bash
# Find clients without timeout
grep -r "httpClient\|HttpClient" package/*/http/client/ | grep -v "timeout"

# Find hardcoded API keys
grep -r "apiKey.*=.*['\"]" package/ --exclude-dir=node_modules

# Find clients without error handling
grep -r "async.*Client" package/*/http/client/*.ts | grep -v "try\|catch"

# Find clients shared across modules
grep -r "from '@.*/http/client" package/
```

---

## Summary

### Quick Reference

- **Patterns**: Mock (dev/test), HTTP (REST APIs), SDK (vendor APIs)
- **Encapsulation**: ALL HTTP/API details in client class
- **Injection**: Direct (default), Interface (only for replaceability)
- **Resilience**: Timeouts, retries, circuit breakers, graceful degradation
- **Security**: Environment variables, ConfigService, sanitized logs

### Checklist

- [ ] Client encapsulates ALL HTTP/API details
- [ ] Direct injection (default) or interface (only if replaceable)
- [ ] Timeouts configured
- [ ] Error handling (don't cascade failures)
- [ ] Circuit breaker for critical services
- [ ] No hardcoded API keys
- [ ] Sensitive data not logged
- [ ] Clients within module boundaries

---

## Next Steps

- **Resilience**: See [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md) for circuit breaker patterns
- **Modular Principles**: See [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md) for Principle 6 (Replaceability)
- **Coding Patterns**: See [CODING-PATTERNS.md](./CODING-PATTERNS.md) for service patterns

---

**Last Updated**: January 2026  
**Maintained By**: Architecture Team
