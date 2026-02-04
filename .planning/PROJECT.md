# Fakeflix Multi-Currency Support

## What This Is

Multi-currency support for the Fakeflix billing system, enabling USD and BRL currencies across the subscription lifecycle. This adds the missing `currency` field to Subscription, removes hardcoded "USD" values, and implements validation to ensure currency consistency from Plan through Payment.

## Core Value

Users in Brazil can subscribe and be billed in BRL with full data integrity — no currency mismatches anywhere in the billing chain.

## Requirements

### Validated

(None yet — this is new functionality)

### Active

- [ ] Add `currency` field to Subscription entity with migration
- [ ] Subscription inherits currency from Plan on creation
- [ ] Invoice uses subscription.currency (remove hardcoded USD)
- [ ] Credit application validates currency match
- [ ] Validate Plan.currency is in supported currencies (USD, BRL)
- [ ] API responses include currency field where applicable
- [ ] Custom exceptions for currency validation failures
- [ ] Configuration for supported currencies whitelist
- [ ] Unit tests for currency validations (>90% coverage)
- [ ] Integration tests for BRL subscription flow
- [ ] E2E tests for full USD and BRL billing cycles

### Out of Scope

- Currency conversion between USD and BRL — adds complexity, not needed for V1
- All ISO 4217 currencies — only USD + BRL for Brazil launch
- Multiple currencies per user — one active subscription at a time
- Geolocation-based pricing — V2+ consideration
- Payment gateway configuration — assume gateway supports BRL

## Context

**Current state:** The billing module has `currency` fields on Plan, Invoice, Payment, Charge, Credit, and AddOn entities. However:
- Subscription entity **lacks** a currency field
- InvoiceGeneratorService hardcodes "USD" (line 78)
- CreditManagerService hardcodes "USD" (line 58)
- No validation prevents cross-currency operations

**Technical environment:**
- NestJS + TypeORM
- PostgreSQL with dedicated `billing` datasource
- Modular architecture (billing is independent module)
- Existing entities ready for currency except Subscription

**Business driver:** Brazil market expansion (Q1 2026) — largest streaming market in Latin America

## Constraints

- **Tech stack**: NestJS, TypeORM, PostgreSQL — existing patterns must be followed
- **Architecture**: Module isolation — billing datasource only, no cross-module entity imports
- **Scope**: USD + BRL only for V1
- **Dependencies**: Payment gateway must support BRL (verification required before deploy)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Add currency to Subscription (not derive from Plan on read) | Explicit storage ensures consistency even if Plan changes | — Pending |
| Whitelist approach for supported currencies | Easy to extend, explicit control | — Pending |
| Reject mismatched currencies (not convert) | Conversion adds complexity, not needed for V1 | — Pending |
| Backfill existing subscriptions from their Plan | Ensures data consistency post-migration | — Pending |

---
*Last updated: 2026-02-04 after initialization*
