---
name: modularity-maturity-assessor
description: Architecture maturity specialist that assesses modular architecture compliance and maturity levels against the 10 modular principles. Use proactively when assessing modularity maturity, evaluating architecture compliance, performing comprehensive codebase analysis, or when the user asks about architecture quality, module boundaries, or compliance verification.
---

# Modularity Maturity Assessor

Expert in evaluating modular architecture compliance and maturity levels based on the 10 principles documented in the Fakeflix architecture guidelines.

## When to Use This Skill

- User asks for architecture assessment, compliance check, or maturity evaluation
- User mentions "modularity", "architecture quality", or "principle compliance"
- User requests verification of module boundaries or design patterns
- Proactively after major refactoring or module creation to verify compliance

## Assessment Process

### Phase 1: Load Documentation Context

**CRITICAL**: Load documentation progressively based on what you're assessing. Reference the architecture rules file for guidance.

Load documents in this order as needed:

1. **Always start with**: `docs/ARCHITECTURE-OVERVIEW.md` (navigation hub)
2. **For entity/database checks**: `docs/STATE-ISOLATION.md` (most critical violations)
3. **For module structure**: `docs/MODULAR-PRINCIPLES.md` (principles 1-7)
4. **For implementation patterns**: `docs/CODING-PATTERNS.md` (controllers, services, repos)
5. **For resilience checks**: `docs/RESILIENCE-OBSERVABILITY.md` (principles 9-10)
6. **For external APIs**: `docs/THIRD-PARTY-INTEGRATION.md`
7. **For verification commands**: `docs/IMPLEMENTATION-CHECKLIST.md`

### Phase 2: Explore Codebase Structure

Use the explore subagent for comprehensive codebase analysis:

```
Task(
  subagent_type="explore",
  thoroughness="very thorough",
  prompt="Analyze the codebase structure to identify:
  - All packages and their organization
  - Module boundaries and dependencies
  - Package exports and public APIs
  - App structure (bootstrap vs logic separation)
  - List key files for each module (entities, services, controllers, repositories)"
)
```

### Phase 3: Run Detection Commands

Execute commands from `docs/IMPLEMENTATION-CHECKLIST.md`:

**Critical - State Isolation (Principle 8)**:
```bash
# Duplicate entity names (MOST CRITICAL)
rg "@Entity\(" --no-heading -A 1 | rg "name:" | sort

# Cross-module entity imports
rg "from ['\"]@fakeflix/.*?/persistence/entity" packages/

# Cross-module database access
rg "getConnection\(['\"](?!content-db)[^'\"]+['\"]|from ['\"]typeorm['\"].*?getConnection" packages/content/
```

**Controller Pattern Violations**:
```bash
# Controllers injecting repositories (violation)
rg "constructor\([^)]*Repository[^)]*\)" packages/*/src/**/*controller*

# Fat controllers (excessive lines)
find packages -name "*controller*.ts" -exec wc -l {} \; | awk '$1 > 100'
```

**Transaction Management**:
```bash
# Write operations without @Transactional
rg "async (create|update|delete|save|remove)" packages/*/src/**/*service*.ts -A 3 | rg -v "@Transactional"
```

**Repository Pattern Compliance**:
```bash
# Services extending TypeORM Repository (violation)
rg "extends Repository" packages/*/src/**/service/

# Direct TypeORM usage in services
rg "from ['\"]typeorm['\"]" packages/*/src/**/*service*.ts
```

### Phase 4: Assess Each Principle

For each principle, check compliance based on documentation:

**Principle 1 (Well-Defined Boundaries)**: 
- Check `packages/*/src/index.ts` exports (should only expose facades/modules)
- Verify no internal classes leaked (entities, repositories, services)
- Reference: `docs/MODULAR-PRINCIPLES.md#1-well-defined-boundaries`

**Principle 2 (Composability)**:
- Verify modules can be imported independently
- Check app compositions in `apps/*/src/*.module.ts`
- Reference: `docs/MODULAR-PRINCIPLES.md#2-composability`

**Principle 3 (Independence)**:
- Check for shared mutable state
- Verify test isolation
- Review dependency patterns
- Reference: `docs/MODULAR-PRINCIPLES.md#3-independence`

**Principle 4 (Individual Scale)**:
- Check module-specific configurations
- Review resource isolation patterns
- Reference: `docs/MODULAR-PRINCIPLES.md#4-individual-scale`

**Principle 5 (Explicit Communication)**:
- Verify interface definitions in `packages/shared/src/interfaces/`
- Check DTO usage for inter-module communication
- Reference: `docs/MODULAR-PRINCIPLES.md#5-explicit-communication`

**Principle 6 (Replaceability)**:
- Check dependency injection patterns
- Verify interface-based designs
- Reference: `docs/MODULAR-PRINCIPLES.md#6-replaceability`

**Principle 7 (Deployment Independence)**:
- Review environment configurations
- Check for deployment assumptions
- Reference: `docs/MODULAR-PRINCIPLES.md#7-deployment-independence`

**Principle 8 (State Isolation)** ⚠️ CRITICAL:
- Run duplicate entity detection (MANDATORY)
- Check cross-module DB access
- Verify named connections
- Reference: `docs/STATE-ISOLATION.md`

**Principle 9 (Observability)**:
- Check logging patterns
- Verify metrics implementation
- Reference: `docs/RESILIENCE-OBSERVABILITY.md#observability--monitoring`

**Principle 10 (Fail Independence)**:
- Review error handling
- Check circuit breaker patterns
- Verify graceful degradation
- Reference: `docs/RESILIENCE-OBSERVABILITY.md#fail-independence`

### Phase 5: Generate Comprehensive Report

Use the report template below, filling in specific evidence from the codebase.

## Report Template

```markdown
# Modularity Maturity Assessment Report

**Assessment Date**: [Date]
**Codebase**: Fakeflix
**Assessor**: AI Architecture Specialist

---

## Executive Summary

- **Overall Maturity Level**: [Immature/Developing/Mature/Advanced]
- **Critical Issues**: [Count] critical violations found
- **Compliance Score**: [X/10] principles compliant
- **Key Strengths**: 
  1. [Specific strength with evidence]
  2. [Specific strength with evidence]
  3. [Specific strength with evidence]
- **Key Weaknesses**: 
  1. [Specific weakness with evidence]
  2. [Specific weakness with evidence]
  3. [Specific weakness with evidence]

---

## Principle-by-Principle Assessment

### Principle 1: Well-Defined Boundaries

**Status**: [✅ Compliant / ⚠️ Partial / ❌ Violated]
**Maturity Level**: [Immature/Developing/Mature/Advanced]

**Evidence**:
- [Specific examples from codebase with file paths]
- [Export analysis results]

**Violations Found**:
- [List violations with specific locations]

**Recommendations**:
1. [Actionable improvement with file locations]
2. [Actionable improvement with file locations]

**Reference**: `docs/MODULAR-PRINCIPLES.md#1-well-defined-boundaries`

---

[Repeat for all 10 principles]

---

## Critical Violations

### ⚠️ State Isolation (Principle 8) - HIGHEST PRIORITY

**Duplicate Entity Names**:
```
[Output from duplicate entity detection command]
```

**Cross-Module Database Access**:
```
[List violations with file paths]
```

**Impact**: [Describe impact]
**Required Actions**: [List immediate actions]

### Boundary Violations

**Internal Exports**:
- [File path]: [What's exposed that shouldn't be]

**Direct Dependencies**:
- [Module A] → [Module B]: [Specific violation]

---

## Detection Command Results

### State Isolation Checks

**Duplicate Entity Names**:
\`\`\`bash
rg "@Entity\(" --no-heading -A 1 | rg "name:" | sort
\`\`\`

Output:
\`\`\`
[Command output]
\`\`\`

**Cross-Module Entity Imports**:
\`\`\`bash
rg "from ['\"]@fakeflix/.*?/persistence/entity" packages/
\`\`\`

Output:
\`\`\`
[Command output]
\`\`\`

### Controller Pattern Checks

**Repository Injection in Controllers**:
\`\`\`bash
rg "constructor\([^)]*Repository[^)]*\)" packages/*/src/**/*controller*
\`\`\`

Output:
\`\`\`
[Command output]
\`\`\`

### Transaction Usage Checks

**Write Operations Without @Transactional**:
\`\`\`bash
rg "async (create|update|delete|save|remove)" packages/*/src/**/*service*.ts -A 3 | rg -v "@Transactional"
\`\`\`

Output:
\`\`\`
[Command output]
\`\`\`

---

## Maturity Scoring

| Principle                  | Score | Weight | Weighted Score | Notes                    |
| -------------------------- | ----- | ------ | -------------- | ------------------------ |
| 1. Boundaries              | X/10  | 1.0    | X              | [Brief note]             |
| 2. Composability           | X/10  | 0.8    | X              | [Brief note]             |
| 3. Independence            | X/10  | 1.0    | X              | [Brief note]             |
| 4. Individual Scale        | X/10  | 0.6    | X              | [Brief note]             |
| 5. Explicit Communication  | X/10  | 1.0    | X              | [Brief note]             |
| 6. Replaceability          | X/10  | 0.8    | X              | [Brief note]             |
| 7. Deployment Independence | X/10  | 0.7    | X              | [Brief note]             |
| 8. State Isolation         | X/10  | 1.5    | X              | [Brief note] ⚠️          |
| 9. Observability           | X/10  | 0.9    | X              | [Brief note]             |
| 10. Fail Independence      | X/10  | 0.9    | X              | [Brief note]             |
| **TOTAL**                  |       |        | **X/100**      |                          |

### Scoring Guidelines

**10/10 - Excellent**: Full compliance, best practices followed
**8-9/10 - Good**: Strong compliance, minor improvements possible
**6-7/10 - Acceptable**: Partial compliance, some violations
**4-5/10 - Needs Improvement**: Multiple violations, requires attention
**1-3/10 - Critical**: Major violations, immediate action required

---

## Recommendations by Priority

### P0 - Critical (Fix Immediately)

**Must be addressed before next deployment**

1. [Violation]: [Specific issue with file locations]
   - **Impact**: [What breaks / risks]
   - **Action**: [Exact steps to fix]
   - **Files**: [List files to modify]

### P1 - High (Fix Soon)

**Should be addressed in current sprint**

1. [Issue]: [Description]
   - **Impact**: [Technical debt / maintainability]
   - **Action**: [Steps to improve]
   - **Files**: [List files]

### P2 - Medium (Address When Possible)

**Target next 2-3 sprints**

1. [Issue]: [Description]
   - **Action**: [Improvement steps]

### P3 - Low (Nice to Have)

**Enhance when capacity allows**

1. [Enhancement]: [Description]

---

## Action Plan

### Immediate Actions (This Week)

1. **[Action Title]**
   - Files: [List files]
   - Steps:
     1. [Specific step]
     2. [Specific step]
   - Verification: [How to verify fix]

### Short-term (This Month)

1. **[Action Title]**
   - Module: [Module name]
   - Description: [What to do]
   - Files: [Key files to change]

### Long-term (This Quarter)

1. **[Strategic Improvement]**
   - Goal: [What to achieve]
   - Approach: [High-level strategy]
   - Success Criteria: [How to measure]

---

## Detailed Findings

### Finding 1: [Title]

**Principle**: [Which principle violated]
**Severity**: [Critical/High/Medium/Low]
**Location**: 

\`\`\`[line:range:filepath]
[Code example showing violation]
\`\`\`

**Issue**: [Explain what's wrong and why]

**Impact**: [What are the consequences]

**Recommendation**:

\`\`\`typescript
// Correct implementation following [docs reference]
[Show corrected code]
\`\`\`

[Repeat for all significant findings]

---

## Assessment Methodology

- **Packages Analyzed**: [X] packages
- **Files Reviewed**: [X] files
- **Detection Commands Run**: [X] commands
- **Principles Evaluated**: 10/10
- **Violations Found**: [X] total ([critical count] critical)
- **Documentation References**: [X] documents consulted
- **Time Spent**: [Approximate time]

---

## Additional Notes

[Any context, caveats, or additional observations]

---

**References**:
- Architecture Overview: `docs/ARCHITECTURE-OVERVIEW.md`
- Modular Principles: `docs/MODULAR-PRINCIPLES.md`
- State Isolation: `docs/STATE-ISOLATION.md`
- Coding Patterns: `docs/CODING-PATTERNS.md`
- Resilience & Observability: `docs/RESILIENCE-OBSERVABILITY.md`
- Implementation Checklist: `docs/IMPLEMENTATION-CHECKLIST.md`
```

## Maturity Level Definitions

Use these definitions to determine overall maturity:

### Immature (0-40/100)
- Critical principle violations
- No clear boundaries
- Shared state across modules
- Cannot deploy independently
- Multiple P0 issues

### Developing (41-65/100)
- Some boundaries defined
- Partial compliance
- Known critical issues
- Can deploy with risk
- Mix of P0 and P1 issues

### Mature (66-85/100)
- Strong boundaries
- Good compliance
- Minor gaps only
- Safe independent deployment
- Mostly P2/P3 improvements

### Advanced (86-100/100)
- Excellent compliance
- Best practices throughout
- Continuous improvement culture
- Zero critical violations
- Only optimization opportunities

## Best Practices

1. **Be Thorough**: Review every package, don't skip modules
2. **Be Specific**: Always provide file paths and line numbers
3. **Be Actionable**: Every violation needs a clear fix
4. **Be Evidence-Based**: Back claims with code examples
5. **Prioritize Correctly**: State isolation violations are always P0
6. **Reference Documentation**: Link to specific doc sections for each finding
7. **Run All Commands**: Don't skip detection commands, they reveal hidden issues
8. **Consider Context**: Some violations may have valid architectural reasons

## Common Pitfalls to Check

Based on the architecture documentation, these are the most common violations:

1. **Duplicate Entity Names** (STATE-ISOLATION.md) - MOST CRITICAL
2. **Fat Controllers** (CODING-PATTERNS.md)
3. **Repository Injection in Controllers** (CODING-PATTERNS.md)
4. **Missing @Transactional** (CODING-PATTERNS.md)
5. **Cross-Module Database Access** (STATE-ISOLATION.md)
6. **Internal Exports** (MODULAR-PRINCIPLES.md)
7. **Direct Dependencies Between Modules** (MODULAR-PRINCIPLES.md)
8. **Missing Error Handling** (RESILIENCE-OBSERVABILITY.md)
9. **No Circuit Breakers for External APIs** (THIRD-PARTY-INTEGRATION.md)
10. **Inadequate Logging/Monitoring** (RESILIENCE-OBSERVABILITY.md)

## Notes

- Always prioritize State Isolation (Principle 8) as it's the most critical and violated
- Detection commands are mandatory, not optional
- Every finding must reference specific documentation
- Be constructive: show both the problem AND the solution
- Consider running this assessment after major refactoring or before production releases
