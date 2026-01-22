# Billing Module - Complex Subscription Billing System

This module implements a **production-grade subscription billing system** with rich business logic complexity, designed for educational purposes in a software engineering course.

## 🎯 Overview

The billing module manages the complete lifecycle of subscription billing for a streaming service, including:

- Plan management and changes with proration
- Add-on management
- Usage-based (metered) billing with tiered pricing
- Multi-provider tax calculation (Standard, EasyTax, VAT)
- Discount engine with priority and stacking rules
- Credit management (FIFO application)
- Invoice generation and consolidation
- Payment retry logic (Dunning)

## 🏗️ Architecture

The module follows **modular architecture principles** with clear separation:

```
billing/
├── core/                    # Domain logic (NEVER exported)
│   ├── enum/                # Business enums
│   ├── service/             # Business services (9 services)
│   └── interface/           # Domain interfaces
├── persistence/             # Data layer (NEVER exported)
│   ├── entity/              # TypeORM entities (16 entities)
│   ├── repository/          # Data repositories (14 repositories)
│   └── migration/           # Database migrations
├── http/                    # External interface (NEVER exported)
│   └── rest/                # REST API layer
│       ├── controller/      # HTTP controllers
│       └── dto/             # Request/Response DTOs
├── integration/             # External integrations
│   └── provider/            # Integration providers (3 mocked)
└── index.ts                 # Public API exports ONLY
```

## 📚 Core Services

### 1. **SubscriptionBillingService** (Main Orchestrator)

The central service coordinating all billing operations.

**Key Methods:**

- `changePlan()` - Complex plan changes with proration
- `addAddOn()` - Add features to subscriptions
- `generateMonthlyInvoice()` - Consolidate billing period charges

### 2. **ProrationCalculatorService**

Handles proportional billing calculations when plans change mid-cycle.

**Features:**

- Credit calculation for unused time (excluding tax)
- Charge calculation for new plan (including tax)
- Different billing interval conversions (Monthly ↔ Annual)
- Leap year handling

### 3. **UsageBillingService**

Implements metered/usage-based billing with progressive tiers.

**Features:**

- Usage recording with multipliers (4K = 2x, downloads = 1.5x)
- Tiered pricing (0-500 hours @ $0.10, 501+ @ $0.05)
- Quota management and warnings
- Aggregation and forecasting

### 4. **TaxCalculatorService**

Multi-provider tax calculation supporting complex scenarios.

**Providers:**

- **Standard**: Internal tax rates by region
- **EasyTax**: External API for complex jurisdictions (mocked)
- **VAT MOSS**: European VAT compliance

**Features:**

- Automatic provider selection by address
- Fallback on provider errors
- Detailed jurisdiction breakdowns

### 5. **DiscountEngineService**

Complex discount application with business rules.

**Features:**

- Priority-based ordering
- Stackability rules
- Cascading calculations
- Redemption limit enforcement
- Multiple discount types (%, fixed, first-months, referral, bundle)

### 6. **CreditManagerService**

Credit lifecycle management with FIFO application.

**Features:**

- Credit types (refund, service, promotional, proration)
- FIFO application (expiring soonest first)
- Credit expiration handling
- Partial credit application

### 7. **InvoiceGeneratorService**

Invoice consolidation and generation.

**Features:**

- Unique invoice numbering (INV-{YYYYMM}-{userId}-{seq})
- Total calculations with taxes, discounts, credits
- Due date management
- Invoice finalization workflow

### 8. **AddOnManagerService**

Add-on lifecycle management.

**Features:**

- Compatibility validation
- Proration on add/remove
- Migration during plan changes
- Plan requirement enforcement

### 9. **DunningManagerService**

Payment retry logic for failed payments.

**Schedule:**

- Day 1: Immediate retry
- Day 3: Retry + email
- Day 7: Retry + notification
- Day 10: Downgrade warning
- Day 15: Cancel subscription

## 💳 Integration Providers (Mocked)

### EasyTaxProvider

Simulates external tax API with realistic features:

- API latency simulation (100-300ms)
- 5% failure rate for error handling
- Detailed jurisdiction breakdowns
- Realistic tax rates by state

### PaymentGatewayProvider

Simulates payment processing (Stripe-like):

- 90% success rate
- Realistic failure reasons
- Transaction ID generation
- Refund processing

### AccountingIntegrationProvider

Simulates accounting system sync:

- Invoice sync
- Payment sync
- External ID tracking

## 📊 Data Model

### Core Entities

- **Plan**: Subscription plans with pricing
- **Subscription**: User subscriptions with metadata
- **Invoice**: Consolidated billing documents
- **InvoiceLineItem**: Individual charges on invoices
- **Charge**: All types of charges
- **Credit**: User credits (various types)
- **AddOn**: Additional features
- **UsageRecord**: Metered usage tracking
- **TaxRate**: Regional tax rates
- **Discount**: Discount codes and rules
- **Payment**: Payment transactions
- **DunningAttempt**: Payment retry tracking

## 🧮 Complex Calculations

### Proration Formula

```
Credit = (Unused Days / Total Days) * Original Amount * (1 - Tax Rate)
Charge = (Days to Bill / New Plan Days) * New Plan Amount
Net = Charge - Credit
```

### Usage Tiering

```
Example: 600 streaming hours
- 0-100: Included ($0)
- 101-500: 400 hours × $0.10 = $40.00
- 501+: 100 hours × $0.05 = $5.00
Total: $45.00
```

### Tax Calculation

```
Standard: Lookup by region
EasyTax: API call with address validation
VAT: Country-specific rates + reverse charge for B2B
```

## 🎓 Educational Value

This implementation demonstrates:

1. **Service Orchestration**: Main service coordinating 8+ specialized services
2. **Financial Calculations**: Decimal.js for precision, complex formulas
3. **Multi-Strategy Pattern**: Tax providers, discount types
4. **Transaction Management**: @Transactional decorators, consistency
5. **External Integrations**: Mocked providers with realistic behavior
6. **Domain-Driven Design**: Clear boundaries, rich domain model
7. **SOLID Principles**: Single responsibility, dependency injection
8. **Error Handling**: Fallbacks, retries, graceful degradation
9. **Event-Driven Architecture**: Event emission for downstream systems
10. **Complex Business Rules**: Stackability, compatibility, validation

## 📈 Metrics & Observability

The system includes logging and metrics for:

- Proration accuracy
- Tax calculation time
- Payment success rates
- Credit utilization
- Usage patterns
- Dunning effectiveness

## 🧪 Testing Approach

Each service is independently testable with:

- Unit tests for business logic
- Integration tests for database operations
- Mock providers for external systems
- Edge case coverage (leap years, same-day changes, etc)

## 🚀 Usage Example

```typescript
// Change plan with complex proration
const result = await subscriptionBillingService.changePlan(userId, newPlanId, {
  effectiveDate: new Date(),
  chargeImmediately: true,
  keepAddOns: false,
});

console.log(`Proration credit: $${result.invoice.totalCredit}`);
console.log(`Amount due: $${result.invoice.amountDue}`);
```

## 📝 Key Learnings

1. **Complexity Management**: Breaking down a 1793-line monolith into 9 focused services
2. **Financial Precision**: Using Decimal.js prevents floating-point errors
3. **External Integration**: Designing for failure with fallbacks and retries
4. **Business Rules**: Implementing complex cascading logic (discounts, credits)
5. **State Machines**: Managing subscription and invoice lifecycles
6. **Time-based Calculations**: Handling dates, periods, and proration
7. **Modular Architecture**: Following strict boundaries for maintainability

## 📖 References

- Inspired by `bill-test.service.ts` (procurement module)
- Follows modular architecture principles (see `docs/ARCHITECTURE-OVERVIEW.md`)
- Based on real-world SaaS billing systems (Stripe, Chargebee, Zuora)

---

**Note**: This is educational code designed to demonstrate complex business logic. All integrations are mocked for learning purposes.
