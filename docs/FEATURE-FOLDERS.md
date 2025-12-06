# Feature Folders
*Organizing code as Vertical Slices*

**Feature Folders** é organizar código por funcionalidades de negócio, onde cada pasta (feature) contém TUDO necessário para aquela funcionalidade - lógica, apresentação, persistência. 

Cada feature é uma **vertical slice**: uma fatia que corta todas as camadas técnicas verticalmente, promovendo alta coesão dentro da feature e baixo acoplamento entre features.

**Also known as**: Vertical Slice Architecture, Package by Feature, Screaming Architecture

---

## TL;DR for LLMs

```
✅ DO: Organize by business features (movie/, subscription/, user/)
❌ DON'T: Organize by technical layers (controllers/, services/, repositories/)

Each feature folder = vertical slice with core/ + http/ + persistence/
Use decision tree to decide: new feature vs sub-feature vs shared/
```

---

## 📊 Visual: Horizontal vs Vertical

```
❌ Traditional Architecture (Horizontal Layers)

┌─────────────────────────────────────────────┐
│         Controllers/                         │  ← Layer 1
│  movie.controller │ show.controller │ user   │
├─────────────────────────────────────────────┤
│         Services/                            │  ← Layer 2
│  movie.service    │ show.service    │ user   │
├─────────────────────────────────────────────┤
│         Repositories/                        │  ← Layer 3
│  movie.repo       │ show.repo       │ user   │
└─────────────────────────────────────────────┘

Problem: Code for ONE feature scattered across 3+ folders


✅ Feature Folders (Vertical Slices)

┌──────────┬──────────┬──────────┬──────────┐
│  movie/  │  show/   │  user/   │  invoice/│  ← Each is a
│          │          │          │          │     complete
│  core/   │  core/   │  core/   │  core/   │     vertical
│  http/   │  http/   │  http/   │  http/   │     slice
│  persist │  persist │  persist │  persist │
│  /       │  /       │  /       │  /       │
└──────────┴──────────┴──────────┴──────────┘

Benefit: Everything for ONE feature in ONE place
```

⚠️ **Key Insight**: Each column is a "vertical slice" that cuts through all technical layers.

---

## 🏗️ Organization Hierarchy (3 Levels)

Our codebase uses 3 levels of organization:

### Level 1: 📦 Package (Bounded Context)
```
content/          ← Package
billing/          ← Package  
identity/         ← Package
```

- Aligned with DDD bounded contexts
- Each package = independent domain with its own models
- Examples: `content` (videos, movies), `billing` (subscriptions, invoices)

### Level 2: 📁 Module (Sub-domain)
```
content/
├── admin/           ← Module
├── catalog/         ← Module
└── video-processor/ ← Module
```

- Logical separation of responsibilities within a context
- Each module can be a NestJS module (Multi-Module Pattern) or just folders (Single Module)
- Examples: `admin` (management), `catalog` (public viewing), `video-processor` (AI processing)

### Level 3: 🎯 Feature (Vertical Slice)
```
content/admin/
├── movie/              ← Feature folder!
├── tv-show/            ← Feature folder!
└── age-recommendation/ ← Feature folder!
```

**THIS is where we apply Feature Folders!**
- Each folder = complete vertical slice
- Contains core/ + http/ + persistence/ + tests/
- Can evolve independently

---

## 📂 Anatomy of a Feature Folder

Template structure:

```typescript
movie/                          // ← Feature folder name (business concept)
├── core/                       // ↓ Business Logic Layer (vertical)
│   ├── service/
│   │   └── movie.service.ts             // Domain services
│   ├── use-case/
│   │   └── create-movie.use-case.ts     // Application use-cases
│   ├── enum/
│   │   └── movie-status.enum.ts         // Domain enums
│   └── interface/
│       └── movie-rating.interface.ts    // Domain interfaces
│
├── http/                       // ↓ Presentation Layer (vertical)
│   ├── rest/
│   │   ├── controller/
│   │   │   └── movie.controller.ts      // REST endpoints
│   │   └── dto/
│   │       ├── request/
│   │       │   └── create-movie.dto.ts
│   │       └── response/
│   │           └── movie-response.dto.ts
│   └── graphql/                         // OR GraphQL (if applicable)
│       ├── resolver/
│       │   └── movie.resolver.ts
│       └── type/
│           └── movie.type.ts
│
├── persistence/                // ↓ Data Layer (vertical)
│   ├── entity/
│   │   └── movie.entity.ts              // Movie OWNS this entity
│   └── repository/
│       └── movie.repository.ts          // Data access
│
├── queue/                      // ↓ Async Processing (if needed)
│   ├── consumer/
│   │   └── movie-processing.consumer.ts
│   └── producer/
│       └── movie-job.producer.ts
│
└── __test__/                   // ↓ Tests (vertical)
    ├── e2e/
    │   └── movie.spec.ts
    └── unit/
        └── movie.service.spec.ts
```

### Real Example from our codebase:

```typescript
// content/admin/movie/ (actual structure)
movie/
├── core/
│   └── use-case/
│       └── create-movie.use-case.ts        // Business logic
├── http/
│   ├── client/
│   │   └── external-movie-rating/         // External API client
│   │       └── external-movie-rating.client.ts
│   └── rest/
│       ├── controller/
│       │   └── admin-movie.controller.ts   // POST /admin/movie
│       └── dto/
│           ├── request/
│           │   └── create-movie.dto.ts
│           └── response/
│               └── create-movie.dto.ts
└── __test__/
    └── e2e/
        └── admin-movie.spec.ts             // E2E tests

// ✅ Everything about Movie management in one place
// ✅ Can add features, refactor, or extract to microservice easily
```

---

## 🌳 Decision Tree: When to Create a Feature Folder?

Use this flowchart when adding new functionality:

```
START: New functionality needs to be implemented

    ↓
    
❓ Does it have its own business vocabulary?
   (e.g., "Movie" has rating, duration, cast)
    │
    ├─ NO → It's a sub-feature, add to existing feature
    │         Example: "Add-on" is part of "Subscription"
    │
    └─ YES ↓

❓ Does it have a controller/resolver at ROOT level?
   (e.g., /movies vs /subscriptions/:id/add-ons)
    │
    ├─ NO → Probably a sub-feature
    │         Example: /subscriptions/:id/add-ons → part of subscription/
    │
    └─ YES ↓

❓ Can it exist without other features?
   (e.g., Movie exists alone vs Add-on needs Subscription)
    │
    ├─ NO → Sub-feature, integrate into parent
    │         Example: Discount needs Subscription → part of subscription/
    │
    └─ YES ↓

❓ Does it have ≥3 files of its own logic?
   (services, use-cases, entities)
    │
    ├─ NO → Maybe too small, consider if it will grow
    │
    └─ YES ↓

✅ CREATE FEATURE FOLDER!
   Examples: movie/, subscription/, user/, invoice/


⚠️ SPECIAL CASE: Cross-Cutting Concerns

❓ Is it used by ≥2 features but doesn't belong to any?
   (e.g., age-recommendation used by movie AND tv-show)
    │
    └─ YES → Create as separate feature at module level!
              Example: admin/age-recommendation/
```

### Quick Reference Table:

| Criteria | Question | Movie | Add-on | Age Rating |
|----------|----------|-------|--------|-----------|
| **Vocabulary** | Own business terms? | ✅ rating, cast | ❌ uses subscription terms | ✅ rating, categories |
| **Endpoint** | Root-level controller? | ✅ /movies | ❌ /subscriptions/:id/add-ons | ✅ /age-ratings |
| **Independence** | Exists without others? | ✅ Yes | ❌ Needs Subscription | ✅ Yes |
| **Files** | ≥3 files of logic? | ✅ Yes | ⚠️ Maybe | ✅ Yes |
| **Decision** | | ✅ **Feature** | ❌ **Sub-feature** | ✅ **Feature** |

---

## 🎯 Cohesion Criteria (with Real Examples)

### ✅ High Cohesion - Separate Features

#### Example 1: Movie vs TV Show
```
admin/
├── movie/       ✅ Separate features
└── tv-show/     ✅ Separate features
```

**Why separate?**
- Different vocabulary (episodes, seasons vs duration, single rating)
- Different workflows (series have multiple episodes)
- Can scale independently
- Different teams can maintain

#### Example 2: Transcription, Summary, Age-Recommendation
```
video-processor/
├── transcription/        ✅ Separate
├── summary/              ✅ Separate
└── age-recommendation/   ✅ Separate
```

**Why separate?**
- Each uses different AI models
- Separate queue consumers
- Can fail independently (resilience)
- Scale differently (transcription might need more resources)

#### Example 3: Age Recommendation (Cross-Cutting)
```
admin/
├── movie/
├── tv-show/
└── age-recommendation/   ✅ Separate feature!
```

**Why separate?**
- Complex business logic
- Used by Movie AND TV Show (doesn't belong to either)
- Complete use-case with queue consumer
- Has its own service layer

### ❌ Low Cohesion - DO NOT Separate

#### Example 1: Add-on within Subscription
```
subscription/
└── core/
    └── service/
        ├── subscription.service.ts
        └── add-on-manager.service.ts   ✅ Keep here!
```

**Why keep together?**
- Add-on cannot exist without Subscription
- Nested endpoint: `/subscriptions/:id/add-ons`
- Shares vocabulary and business rules
- Tightly coupled lifecycle

#### Example 2: Discount within Subscription
```
subscription/
└── persistence/
    └── entity/
        ├── subscription.entity.ts
        └── discount.entity.ts   ✅ Keep here!
```

**Why keep together?**
- Discount is configuration for Subscription
- No dedicated controller
- Applied as part of subscription logic
- Not meaningful without subscription context

#### Example 3: Episode within TV Show
```
tv-show/
└── persistence/
    ├── entity/
    │   └── tv-show.entity.ts
    └── repository/
        └── episode.repository.ts   ✅ Keep here!
```

**Why keep together?**
- Episode is part of TV Show aggregate
- Managed through TV Show endpoints
- Strong parent-child relationship
- Shares TV Show business rules

---

## 📦 The `shared/` Folder Rules

### ✅ DO use `shared/` for:

**1. Technical Infrastructure**
```
shared/
└── persistence/
    ├── billing-persistence.module.ts    ✅ TypeORM configuration
    ├── typeorm-datasource.factory.ts    ✅ DataSource setup
    └── migration/                        ✅ Database migrations
        └── 1234567890-initial.ts
```

**2. Code used by ≥3 features**
```
shared/
└── core/
    └── enum/
        └── plan-interval.enum.ts   ✅ Used by subscription, invoice, usage
```

**3. Abstract base classes**
```
shared/
└── persistence/
    └── repository/
        └── base.repository.ts   ✅ Generic repository pattern
```

### ❌ DO NOT use `shared/` for:

**1. Domain Entities**
```
// ❌ WRONG
shared/
└── persistence/
    └── entity/
        └── movie.entity.ts   ❌ Entities belong to features!

// ✅ CORRECT
movie/
└── persistence/
    └── entity/
        └── movie.entity.ts   ✅ Movie feature owns this
```

**2. Business Logic**
```
// ❌ WRONG
shared/
└── core/
    └── service/
        └── age-recommendation.service.ts   ❌ Business logic!

// ✅ CORRECT
age-recommendation/
└── core/
    └── service/
        └── content-age-recommendation.service.ts   ✅ Separate feature
```

**3. Used by only 2 features**
```
// ❌ WRONG - premature abstraction
shared/
└── util/
    └── video-validator.util.ts   ❌ Only movie and tv-show use it

// ✅ CORRECT - duplicate for now
movie/core/util/video-validator.util.ts
tv-show/core/util/video-validator.util.ts

💡 HEURÍSTICA: Wait for 3rd usage before abstracting to shared/
```

### Real Example from our codebase:

```typescript
// ✅ GOOD: content/shared/persistence/
shared/
└── persistence/
    ├── entity/                              // Domain entities
    │   ├── content.entity.ts                // ✅ Base entity (used by many)
    │   ├── video.entity.ts                  // ✅ Shared by multiple features
    │   └── thumbnail.entity.ts              // ✅ Shared resource
    ├── persistence.module.ts                // ✅ Infrastructure
    └── typeorm-datasource.factory.ts        // ✅ Configuration

// ✅ GOOD: content/admin/age-recommendation/ (extracted from shared/)
age-recommendation/
└── core/
    └── service/
        └── content-age-recommendation.service.ts   // ✅ Business logic in feature
```

---

## ✅ Implementation Checklist

When creating a new feature folder, follow these steps:

### 1. Planning
- [ ] **Name**: Choose a business noun (movie, subscription, invoice)
- [ ] **Location**: Identify correct module (admin/, catalog/, processor/)
- [ ] **Validation**: Use decision tree - is it really a feature?

### 2. Structure Setup
```bash
# Create folder structure
FEATURE=movie
MODULE=admin

mkdir -p package/content/$MODULE/$FEATURE/core/use-case
mkdir -p package/content/$MODULE/$FEATURE/http/rest/controller
mkdir -p package/content/$MODULE/$FEATURE/http/rest/dto/request
mkdir -p package/content/$MODULE/$FEATURE/http/rest/dto/response
mkdir -p package/content/$MODULE/$FEATURE/__test__/e2e
```

### 3. Core Implementation
- [ ] **Use-case**: Create first use-case in `core/use-case/`
- [ ] **Service**: Add domain service if needed in `core/service/`
- [ ] **Entity**: If owns data, create in `persistence/entity/`
- [ ] **Repository**: Add repository in `persistence/repository/`

### 4. HTTP Layer
- [ ] **Controller/Resolver**: Add in `http/rest/controller/` or `http/graphql/resolver/`
- [ ] **DTOs**: Create request/response DTOs

### 5. Tests
- [ ] **E2E**: Add e2e tests in `__test__/e2e/`
- [ ] **Unit**: Add unit tests alongside implementation

### 6. Module Registration
- [ ] **Import**: Update module file (e.g., `content-admin.module.ts`)
- [ ] **Providers**: Add services, use-cases to providers array
- [ ] **Controllers**: Add controllers to controllers array

### 7. Validation
```bash
# Run linter
nx lint content

# Run tests
nx test content
nx test:e2e content

# Build
nx build content
```

### Example Commands:
```bash
# Create movie feature
cd package/content/admin
mkdir -p movie/core/use-case movie/http/rest/controller movie/__test__/e2e

# Create files
touch movie/core/use-case/create-movie.use-case.ts
touch movie/http/rest/controller/movie.controller.ts
touch movie/__test__/e2e/movie.spec.ts

# Update module
# Edit content-admin.module.ts to import MovieController, CreateMovieUseCase

# Validate
nx lint content && nx test:e2e content
```

---

## ❌ Common Anti-Patterns

### Anti-Pattern 1: God Feature
**Problem**: One feature with 20+ files and multiple responsibilities

```
// ❌ BAD: Everything in movie/
movie/
├── core/service/
│   ├── movie.service.ts
│   ├── review.service.ts          ❌ Should be separate feature
│   ├── recommendation.service.ts  ❌ Should be separate feature
│   ├── analytics.service.ts       ❌ Should be separate feature
│   └── notification.service.ts    ❌ Should be separate feature
```

**Solution**: Extract separate features
```
// ✅ GOOD: Each concept is a feature
admin/
├── movie/
├── review/              ✅ Separate feature
├── recommendation/      ✅ Separate feature
└── analytics/          ✅ Separate feature
```

### Anti-Pattern 2: Anemic Feature
**Problem**: Feature with only entity + repository, no business logic

```
// ❌ BAD: Just data, no behavior
genre/
└── persistence/
    ├── entity/
    │   └── genre.entity.ts      ❌ Only this?
    └── repository/
        └── genre.repository.ts
```

**Solution**: If no business logic, maybe it shouldn't be a feature
```
// ✅ OPTION 1: Part of shared/ (if used by many)
shared/
└── persistence/
    └── entity/
        └── genre.entity.ts   ✅ Simple lookup table

// ✅ OPTION 2: Part of parent feature
movie/
└── persistence/
    └── entity/
        ├── movie.entity.ts
        └── genre.entity.ts   ✅ Movie uses genres
```

### Anti-Pattern 3: Circular Imports
**Problem**: Features importing from each other

```typescript
// ❌ BAD: Circular dependency
// movie/movie.service.ts
import { TvShowService } from '../tv-show/core/service/tv-show.service';  ❌

// tv-show/tv-show.service.ts  
import { MovieService } from '../movie/core/service/movie.service';  ❌
```

**Solution**: Extract common logic to shared/ or create intermediate feature
```typescript
// ✅ GOOD: Common logic in shared/
// shared/core/service/content-base.service.ts
export class ContentBaseService { ... }  ✅

// movie/movie.service.ts
import { ContentBaseService } from '../../shared/core/service/content-base.service';

// tv-show/tv-show.service.ts
import { ContentBaseService } from '../../shared/core/service/content-base.service';
```

### Anti-Pattern 4: Technical Layers at Root
**Problem**: Organizing by technical layers instead of features

```
// ❌ BAD: Horizontal organization
billing/
├── core/              ❌ Technical layer at root
│   ├── subscription/
│   └── invoice/
└── http/              ❌ Technical layer at root
    ├── subscription/
    └── invoice/
```

**Solution**: Features at root, layers inside
```
// ✅ GOOD: Features at root (vertical slices)
billing/
├── subscription/      ✅ Feature folder
│   ├── core/
│   ├── http/
│   └── persistence/
└── invoice/           ✅ Feature folder
    ├── core/
    ├── http/
    └── persistence/
```

---

## 📚 Learn More

### Key Concepts & Thought Leaders

**Vertical Slice Architecture**
- Creator: **Jimmy Bogard** (MediatR, AutoMapper)
- Key idea: Features as complete vertical slices through all layers
- [Blog](https://jimmybogard.com) | [GitHub](https://github.com/jbogard)

**Screaming Architecture**
- Creator: **Robert Martin (Uncle Bob)**
- Key idea: Architecture should "scream" what the system does, not how it's built
- See: Clean Architecture book

**Package by Feature**
- Popularized by: **Martin Fowler**
- Key idea: Package by business feature, not technical function
- Alternative to: Package by Layer

**Domain-Driven Design (DDD)**
- Creator: **Eric Evans**
- Key idea: Bounded contexts align with business domains
- Our packages align with DDD bounded contexts

### Our Implementation

We apply Feature Folders across 3 levels:

1. **Package level**: Bounded contexts (content, billing, identity)
2. **Module level**: Sub-domains when needed (admin, catalog, processor)
3. **Feature level**: Vertical slices (movie, subscription, transcription)

This creates clear boundaries at each level while maintaining the core principle: organize by **what the system does**, not **how it's built**.

---

## 🔄 Migration Guide

Refactoring existing code to Feature Folders:

### Step 1: Identify Current Features
```bash
# List current structure
ls -la billing/services/
# subscription.service.ts, invoice.service.ts, payment.service.ts

# These are your features!
```

### Step 2: Map Dependencies
```bash
# Find what imports what
grep -r "import.*subscription" billing/
```

### Step 3: Create Feature Folders
```bash
mkdir -p subscription/{core/service,http/controller,persistence}
mkdir -p invoice/{core/service,http/controller,persistence}
```

### Step 4: Move Files (keep git history!)
```bash
git mv billing/services/subscription.service.ts billing/subscription/core/service/
git mv billing/controllers/subscription.controller.ts billing/subscription/http/controller/
git mv billing/entities/subscription.entity.ts billing/subscription/persistence/entity/
```

### Step 5: Update Imports
```bash
# Use sed or find-replace in IDE
sed -i '' 's|../services/subscription.service|../subscription/core/service/subscription.service|g' **/*.ts
```

### Step 6: Run Tests
```bash
nx test billing
nx test:e2e billing
nx lint billing
```

### Step 7: Clean Up
```bash
# Remove empty old folders
rm -rf billing/services billing/controllers billing/entities
```

---

## 📋 Quick Reference

### Feature Folder Template
```
feature-name/
├── core/          # Business logic
├── http/          # API layer
├── persistence/   # Data layer
└── __test__/      # Tests
```

### Decision Checklist
- [ ] Has own business vocabulary?
- [ ] Has root-level endpoint?
- [ ] Can exist independently?
- [ ] Has ≥3 files of logic?
→ YES to 3+ = Create feature folder!

### When to use `shared/`
- ✅ Used by ≥3 features
- ✅ Technical infrastructure
- ❌ Business logic
- ❌ Domain entities (they have owners!)

---

**Last Updated**: Based on content/, billing/, identity/ packages as of 2024.
