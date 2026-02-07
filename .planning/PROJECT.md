# Fakeflix — BRL Billing Support

## What This Is

Adding Brazilian Real (BRL) multi-currency support to Fakeflix's existing Stripe-based billing system. Users will choose their currency (USD or BRL) at signup, and all subscription plans will have independently set prices in both currencies. This extends the current USD-only billing to serve Brazilian users natively.

## Core Value

Users in Brazil can subscribe and pay in BRL with fixed, predictable pricing — no currency conversion surprises.

## Requirements

### Validated

- ✓ Stripe-based billing with USD pricing — existing
- ✓ Subscription plans (billing tiers) — existing
- ✓ Credit card payments via Stripe — existing
- ✓ User identity/authentication system — existing
- ✓ Video streaming and content catalog — existing

### Active

- [ ] Multi-currency pricing model (each plan has USD and BRL prices)
- [ ] Currency selection at user signup
- [ ] Stripe integration updated to handle BRL charges
- [ ] Plan display shows prices in user's selected currency
- [ ] Billing history and invoices reflect correct currency
- [ ] Admin ability to set/update BRL prices per plan

### Out of Scope

- PIX payment method — not in v1, credit card only
- Boleto payment method — not in v1, credit card only
- Automatic currency conversion from USD — prices are fixed per currency
- Region-based auto-detection of currency — user chooses explicitly at signup
- Currency switching after signup — currency is fixed once chosen
- Additional currencies beyond USD and BRL — only two currencies for now

## Context

- Fakeflix is a Netflix-like streaming platform built with NestJS and GraphQL
- Billing module already exists with Stripe integration for USD
- Identity module handles user signup and authentication
- Content catalog and video streaming are already functional
- Stripe natively supports BRL, so no new payment processor needed
- Brazilian market requires fixed BRL prices (not converted from USD)

## Constraints

- **Tech stack**: NestJS + GraphQL + Stripe — must work within existing architecture
- **Gateway**: Stripe — BRL support must use Stripe's native multi-currency capabilities
- **Pricing**: Fixed prices per currency — no exchange rate APIs or dynamic conversion
- **Currency lock**: User's currency is set at signup and does not change

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fixed prices per currency (not conversion) | Predictable pricing for users, simpler implementation | — Pending |
| Currency selected at signup (not checkout) | Simpler UX, consistent billing experience | — Pending |
| Credit card only for BRL (no PIX/Boleto) | Reduces scope, Stripe handles both currencies the same way | — Pending |
| Same plans in both currencies | Simpler plan management, consistent offering | — Pending |

---
*Last updated: 2026-02-07 after initialization*
