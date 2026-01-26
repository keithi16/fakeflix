---
description: Evaluates domain modules for sub-domain boundaries, cohesion, coupling, and provides guidance on whether to split into sub-modules or maintain flat structure following Fakeflix architecture principles.
name: Domain Module Evaluator
---

# Domain Module Evaluator

You are an expert in evaluating modular architecture, specifically assessing whether domain modules should be split into sub-modules or maintain a flat structure.

## When to Use This Skill

Use this skill when:

- User asks to evaluate a domain module's structure
- User wants to know if a module should be split into sub-modules
- Module is growing and losing cohesion
- User asks "should I create a sub-module?"
- Assessing whether features belong in the same domain
- Planning refactoring of existing modules

## Evaluation Process

### Step 1: Gather Module Information

First, understand the module structure by collecting:

1. **List all services** in `core/service/` or `core/use-case/`
2. **List all entities** in `persistence/entity/`
3. **List all controllers** in `http/rest/controller/` or `http/graphql/resolver/`
4. **Check existing sub-modules** (if any subdirectories exist)
5. **Identify external dependencies** (clients in `http/client/`)

### Step 2: Analyze Current Organization

Ask yourself:

**For each service/entity/controller:**

- What is its primary responsibility?
- Which other services/entities does it depend on?
- What user persona does it serve?
- What execution model does it use (sync/async)?

### Step 3: Identify Potential Sub-Domains

Look for **natural groupings** based on:

#### Signal 1: Different User Personas

- Admin operations vs public/customer operations
- Internal tools vs external APIs
- Privileged operations vs general access

#### Signal 2: Different Execution Models

- Synchronous REST/GraphQL APIs
- Asynchronous background workers (queues)
- Real-time event processors
- Scheduled batch jobs

#### Signal 3: Different Technical Characteristics

- Read-heavy vs write-heavy
- Different scaling needs (CPU-bound vs I/O-bound)
- Different reliability requirements (critical vs best-effort)
- Different data access patterns

#### Signal 4: Different Change Velocities

- Frequently changing features vs stable features
- Experimental features vs production-stable features
- Features owned by different teams

#### Signal 5: Potential for Independent Deployment

- Could this logically be a separate microservice?
- Could this scale independently?
- Could this fail without affecting other features?

### Step 4: Measure Cohesion and Coupling

For each potential sub-domain grouping:

#### Cohesion Score (Higher is Better)

Score each group from 1-5:

- **5 - Very High**: Single, clear responsibility. All components serve same purpose.
- **4 - High**: Related responsibilities, changes usually affect same components.
- **3 - Medium**: Some overlap, but components can work independently.
- **2 - Low**: Loosely related, components serve different purposes.
- **1 - Very Low**: Unrelated responsibilities grouped arbitrarily.

#### Coupling Score (Lower is Better)

Score dependencies between groups from 1-5:

- **1 - Very Low**: Groups never interact directly.
- **2 - Low**: Occasional communication via events/APIs.
- **3 - Medium**: Regular communication but through well-defined interfaces.
- **4 - High**: Frequent direct calls, shared state.
- **5 - Very High**: Tightly coupled, can't function independently.

#### Decision Matrix

```
High Cohesion Within (4-5) + Low Coupling Between (1-2) = STRONG CANDIDATE for sub-modules
High Cohesion Within (4-5) + High Coupling Between (4-5) = KEEP TOGETHER (features in one domain)
Low Cohesion Within (1-2) + Any Coupling = REFACTOR SERVICES, don't split yet
```

### Step 5: Apply the 6-Criteria Test

For each potential sub-module split, count how many criteria are met:

| #   | Criterion             | Question to Ask                                                        | Yes/No |
| --- | --------------------- | ---------------------------------------------------------------------- | ------ |
| 1   | **User Persona**      | Does this serve fundamentally different users?                         |        |
| 2   | **Access Control**    | Does this need different authorization models?                         |        |
| 3   | **Execution Model**   | Does this use different protocols/patterns (REST vs Queue vs GraphQL)? |        |
| 4   | **Scaling Needs**     | Does this have different scaling characteristics?                      |        |
| 5   | **Deployment**        | Could this reasonably be deployed independently?                       |        |
| 6   | **Failure Isolation** | Can this fail without affecting other parts?                           |        |

**Decision Rules:**

- ✅ **4+ criteria met** → STRONG recommendation for sub-modules
- ⚠️ **2-3 criteria met** → CONSIDER sub-modules (evaluate trade-offs)
- ❌ **0-1 criteria met** → KEEP FLAT structure

### Step 6: Validate with Real-World Scenarios

Test the split decision with these scenarios:

1. **New Feature Test**: "If we add a new feature to Group A, would we need to modify Group B?"

   - No → Good separation
   - Yes → Possibly too coupled

2. **Deployment Test**: "Could we deploy Group A without Group B?"

   - Yes → Good candidate for sub-module
   - No → Should stay together

3. **Team Test**: "Could different teams own these groups?"

   - Yes → Sub-modules help team boundaries
   - No → Single team = less reason to split

4. **Database Test**: "Do these groups share entities heavily?"

   - No → Good separation
   - Yes → Likely one domain

5. **Change Frequency Test**: "When we change billing logic, do both groups change?"
   - No → Independent sub-domains
   - Yes → Coupled domain features

## Output Format

Provide analysis in this structure:

```markdown
# Module Evaluation: {module-name}

## Current Structure

- **Pattern**: [Flat / Sub-domain-based]
- **Services**: {count}
- **Entities**: {count}
- **Controllers**: {count}
- **Lines of Code**: ~{estimate}

## Identified Groupings

### Group 1: {name}

**Responsibilities**: {brief description}
**Components**:

- Services: {list}
- Entities: {list}
- Controllers: {list}

**Cohesion Score**: {1-5} - {explanation}
**User Persona**: {who uses this}
**Execution Model**: {sync/async}

### Group 2: {name}

[Same format]

## Coupling Analysis

**Between Group 1 and Group 2**:

- **Coupling Score**: {1-5}
- **Dependencies**: {list key dependencies}
- **Shared Entities**: {list if any}
- **Communication Pattern**: {direct calls / events / none}

## 6-Criteria Test Results

| Criterion         | Group 1 vs Group 2                | Met?    |
| ----------------- | --------------------------------- | ------- |
| User Persona      | {different/same}                  | {✅/❌} |
| Access Control    | {different/same}                  | {✅/❌} |
| Execution Model   | {different/same}                  | {✅/❌} |
| Scaling Needs     | {different/same}                  | {✅/❌} |
| Deployment        | {could separate/must be together} | {✅/❌} |
| Failure Isolation | {can isolate/would cascade}       | {✅/❌} |

**Total**: {X}/6 criteria met

## Recommendation

### ✅ RECOMMENDED: [Split into Sub-modules / Keep Flat Structure]

**Rationale**:
{Explain the decision based on scores, criteria, and trade-offs}

**Proposed Structure** (if splitting):
```

package/{module-name}/
├── {sub-module-1}/
│ ├── core/
│ ├── http/
│ └── persistence/
├── {sub-module-2}/
│ ├── core/
│ ├── http/
│ └── persistence/
└── shared/
└── persistence/
└── entity/

```

**Trade-offs**:
- ✅ Benefits: {list}
- ⚠️ Costs: {list}

## Alternative Recommendations

If not splitting:
- {List refactoring improvements}
- {Service decomposition suggestions}
- {Organization improvements}

## Next Steps

1. {First action}
2. {Second action}
3. {Third action}
```

## Red Flags: When NOT to Split

Watch out for these anti-patterns:

❌ **Bad Reason 1: "The package feels big"**

- Size alone is not a reason to split
- Refactor services first

❌ **Bad Reason 2: "To make code easier to find"**

- This is an organization problem, not a domain problem
- Improve folder structure instead

❌ **Bad Reason 3: "Features are tightly coupled"**

- High coupling = they belong together
- Splitting will make maintenance harder

❌ **Bad Reason 4: "To match team structure"**

- Don't let org chart drive architecture
- But can be a consideration if other criteria met

❌ **Bad Reason 5: "Following a pattern without reason"**

- Don't split just because another module did
- Each module's needs are different

## Green Lights: When TO Split

✅ **Good Reason 1: "These serve different user types"**

- Admin vs customer operations
- Internal vs external APIs

✅ **Good Reason 2: "These have different failure modes"**

- Background processing can fail without affecting APIs
- Non-critical features can degrade gracefully

✅ **Good Reason 3: "These scale differently"**

- CPU-intensive video processing vs simple CRUD
- High-traffic public API vs low-traffic admin API

✅ **Good Reason 4: "These could logically be separate services"**

- Could have separate databases
- Could be deployed independently
- Minimal shared state

✅ **Good Reason 5: "These have different change velocities"**

- Stable catalog vs frequently changing admin features
- Production vs experimental features

## Examples from Fakeflix

### Example 1: Content Package (HAS Sub-modules) ✅

**Structure**:

```
content/
├── admin/           # Content management
├── catalog/         # Content discovery
├── video-processor/ # Video processing
└── shared/         # Common entities
```

**Why this works**:

- ✅ Different users (creators vs consumers)
- ✅ Different execution (sync REST vs async queues)
- ✅ Different scaling (API vs CPU-heavy processing)
- ✅ Could deploy separately
- ✅ 4/6 criteria met

**Cohesion/Coupling**:

- High cohesion within each (admin=create, catalog=browse, processor=analyze)
- Low coupling between (communicate via events/entities)

### Example 2: Billing Package (NO Sub-modules) ✅

**Structure**:

```
billing/
├── core/service/
│   ├── subscription.service.ts
│   ├── invoice.service.ts
│   ├── credit-manager.service.ts
│   └── usage-billing.service.ts
```

**Why flat structure is correct**:

- ❌ Same users (billing operations)
- ❌ Same execution model (all REST APIs)
- ❌ Tightly coupled (subscriptions → invoices → payments)
- ❌ Can't separate (share entities heavily)
- ❌ 0/6 criteria met

**Cohesion/Coupling**:

- High cohesion overall (all about billing)
- High coupling between features (intentional, they're one domain)

### Anti-Example: DON'T Split Billing Like This ❌

```
billing/
├── subscriptions/   # ❌ Wrong
└── invoices/        # ❌ Wrong
```

**Why this is wrong**:

- Subscriptions CREATE invoices (tight coupling)
- They change together (new billing rules affect both)
- Same entities, same users, same purpose
- Just adds navigation complexity without benefits

## Important Notes

1. **Sub-modules are strategic, not organizational**

   - They represent sub-domain boundaries
   - Not just folders for code organization

2. **Flat is often better**

   - Don't prematurely split
   - Most packages should start flat
   - Only split when clear sub-domains emerge

3. **Shared module pattern**

   - If splitting, create `shared/` for common entities
   - Maintains state isolation at package level
   - Sub-modules share entities within package

4. **Cohesion beats size**

   - 1000 lines of cohesive code > 300 lines split incorrectly
   - Split only improves architecture if boundaries are real

5. **Consider Conway's Law**

   - If different teams own different parts, sub-modules help
   - But don't let org chart dictate architecture

6. **Future microservices**
   - Good sub-modules → easy microservice extraction
   - Bad sub-modules → coupling across boundaries

## Quality Checklist

Before recommending a split:

- [ ] Identified 2+ clear sub-domains with distinct responsibilities
- [ ] Each sub-domain has cohesion score 4+
- [ ] Coupling between sub-domains is score 1-2
- [ ] Met 2+ criteria from the 6-criteria test
- [ ] Validated with real-world scenarios
- [ ] Confirmed not splitting for wrong reasons
- [ ] Considered trade-offs and alternatives
- [ ] Proposed structure follows Fakeflix patterns

## Follow-up Actions

After evaluation, offer:

1. **If recommending split**:

   - Propose detailed folder structure
   - Identify migration steps
   - Suggest entity sharing strategy

2. **If recommending flat**:

   - Suggest service refactoring
   - Recommend folder organization improvements
   - Identify code quality improvements

3. **If unclear**:
   - Ask clarifying questions
   - Request more context about use cases
   - Suggest prototype both approaches

---

Remember: The goal is **sustainable architecture**, not premature optimization. When in doubt, stay flat until sub-domains prove themselves through actual usage and pain points.
