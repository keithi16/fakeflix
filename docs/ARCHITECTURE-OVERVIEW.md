# Modular Architecture Overview

This document provides a high-level introduction to our modular architecture approach and serves as a navigation hub to detailed guidelines.

## Core Philosophy

**Modular Architecture** is a pragmatic approach that avoids premature microservices complexity while maintaining clear boundaries between business domains. It provides the benefits of both monoliths (development simplicity) and distributed systems (independence and scalability).

### Key Concepts

- **Apps are Bootstraps**: Applications (`apps/`) only orchestrate modules, containing minimal logic
- **Packages are Logic**: All business logic lives in packages (`packages/`), enabling maximum reusability
- **Domain-Based Organization**: Organize by business capabilities, not technical features
- **Evolutionary Design**: Start modular, extract to microservices only when proven necessary

## The 10 Principles of Modular Architecture

Our architecture is built on 10 foundational principles that ensure maintainability, scalability, and resilience:

| #   | Principle                   | Description                                  | Details                                                                                |
| --- | --------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | **Well-Defined Boundaries** | Clear responsibilities, no internal exposure | [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md#1-well-defined-boundaries)             |
| 2   | **Composability**           | Building blocks that combine flexibly        | [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md#2-composability)                       |
| 3   | **Independence**            | Autonomous operation without tight coupling  | [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md#3-independence)                        |
| 4   | **Individual Scale**        | Module-specific resource optimization        | [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md#4-individual-scale)                    |
| 5   | **Explicit Communication**  | Well-defined contracts for all interactions  | [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md#5-explicit-communication)              |
| 6   | **Replaceability**          | Swappable implementations behind interfaces  | [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md#6-replaceability)                      |
| 7   | **Deployment Independence** | Deployment-agnostic module design            | [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md#7-deployment-independence)             |
| 8   | **State Isolation**         | Own state management per module              | [STATE-ISOLATION.md](./STATE-ISOLATION.md) ⚠️                                          |
| 9   | **Observability**           | Individual visibility and monitoring         | [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md#observability--monitoring) |
| 10  | **Fail Independence**       | Failures don't cascade between modules       | [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md#fail-independence)         |

⚠️ **State Isolation is the most critical and frequently violated principle** - see dedicated document for details.

## Document Organization

Our architecture guidelines are organized into focused documents by responsibility:

### 📘 [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md)

**When to read**: Understanding module boundaries and interactions

Deep dive into principles 1-7 covering:

- How modules should be structured
- Communication patterns between modules
- Composability and independence guidelines
- Code examples for each principle

### 🔒 [STATE-ISOLATION.md](./STATE-ISOLATION.md)

**When to read**: Working with databases, entities, or data access

Critical guidelines for principle 8:

- Entity naming conventions
- Database connection patterns
- **FORBIDDEN**: Duplicate entity names across modules
- Detection commands and verification
- Migration strategies

**Read this before creating any database entities!**

### 🛠️ [CODING-PATTERNS.md](./CODING-PATTERNS.md)

**When to read**: Implementing services, controllers, or repositories

Technical implementation patterns:

- Repository Pattern & ORM Encapsulation
- Controller Responsibilities & Lean Pattern
- Transaction Management & Named Connections
- Anti-patterns to avoid
- Testing strategies

### 🔧 [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md)

**When to read**: Adding monitoring, logging, or error handling

Building resilient systems:

- Observability & Monitoring (Principle 9)
- Fail Independence (Principle 10)
- Circuit breaker patterns
- Graceful degradation
- Health checks and metrics
- Event system implementations

### 🔌 [THIRD-PARTY-INTEGRATION.md](./THIRD-PARTY-INTEGRATION.md)

**When to read**: Integrating external APIs or third-party services

Integration patterns and best practices:

- Mock, HTTP, and SDK integration patterns
- Client encapsulation and architecture compliance
- Direct injection vs interface patterns
- Resilience patterns (circuit breakers, timeouts, retries)
- Security and observability guidelines
- Migration from mock to production

### ✅ [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md)

**When to read**: Starting new features or refactoring code

Practical checklists:

- Verification steps for new features
- Refactoring guidelines
- Common anti-patterns to avoid
- Detection commands
- Automated verification tools
- Pre-commit hooks

Intra-package organization:

- Decision trees for creating features
- Cohesion criteria
- Shared folder rules

## Quick Reference Guide

### I want to...

- **Create a new module** → Read [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md) + [STATE-ISOLATION.md](./STATE-ISOLATION.md)
- **Add a database entity** → Read [STATE-ISOLATION.md](./STATE-ISOLATION.md) first!
- **Create a controller/service** → Read [CODING-PATTERNS.md](./CODING-PATTERNS.md)
- **Add inter-module communication** → Read [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md#5-explicit-communication)
- **Integrate external API** → Read [THIRD-PARTY-INTEGRATION.md](./THIRD-PARTY-INTEGRATION.md)
- **Implement error handling** → Read [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md#fail-independence)
- **Add monitoring/logging** → Read [RESILIENCE-OBSERVABILITY.md](./RESILIENCE-OBSERVABILITY.md#observability--monitoring)
- **Organize code within a package** → Read [FEATURE-FOLDERS.md](./FEATURE-FOLDERS.md)
- **Verify architecture compliance** → Read [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md)

## Document Scope

These documents focus on **inter-package architecture** (how packages interact and the principles that govern modular systems).

For **intra-package organization** (how to structure code within a package), see [FEATURE-FOLDERS.md](./FEATURE-FOLDERS.md).

## Common Pitfalls

🚫 **Most Critical Violations**:

1. **Duplicate Entity Names** - Never use same `@Entity({ name: 'X' })` across modules → [STATE-ISOLATION.md](./STATE-ISOLATION.md)
2. **Fat Controllers** - Business logic belongs in services, not controllers → [CODING-PATTERNS.md](./CODING-PATTERNS.md#controller-responsibilities--lean-pattern)
3. **Direct Repository Calls** - Controllers should only call services → [CODING-PATTERNS.md](./CODING-PATTERNS.md#controller-responsibilities--lean-pattern)
4. **Missing Transaction Decorators** - Write operations need `@Transactional()` → [CODING-PATTERNS.md](./CODING-PATTERNS.md#transaction-management--named-connections)
5. **Cross-Module Database Access** - Never access another module's database → [STATE-ISOLATION.md](./STATE-ISOLATION.md)

## Getting Started

### For New Team Members

1. Read this overview (you're here!)
2. Skim [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md) to understand the 10 principles
3. Read [STATE-ISOLATION.md](./STATE-ISOLATION.md) carefully before touching databases
4. Keep [CODING-PATTERNS.md](./CODING-PATTERNS.md) handy while coding
5. Use [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md) for verification

### For AI Agents

1. Load this overview for navigation
2. Load specific documents based on task:
   - Database work → [STATE-ISOLATION.md](./STATE-ISOLATION.md)
   - Service/Controller work → [CODING-PATTERNS.md](./CODING-PATTERNS.md)
   - Module communication → [MODULAR-PRINCIPLES.md](./MODULAR-PRINCIPLES.md)
   - External API integration → [THIRD-PARTY-INTEGRATION.md](./THIRD-PARTY-INTEGRATION.md)
3. Always run verification commands from [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md)

## Architecture Principles Summary

### What Makes Good Modular Architecture?

✅ **Good Modular Architecture**:

- Clear boundaries between modules
- Explicit communication via interfaces
- Each module owns its data
- Modules can be deployed independently
- Failures isolated to single modules
- Easy to test in isolation

❌ **Bad Modular Architecture**:

- Shared databases between modules
- Direct class dependencies
- Tight coupling
- Cascading failures
- Cannot test modules independently
- Deployment requires all modules

## Additional Resources

- **Nx Workspace Documentation**: See [.cursor/rules/nx-rules.mdc](../.cursor/rules/nx-rules.mdc)
- **Architecture Rules for AI**: See [.cursor/rules/architecture-rules.mdc](../.cursor/rules/architecture-rules.mdc)

---

**Last Updated**: January 2026  
**Maintained By**: Architecture Team
