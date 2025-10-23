# Jira Task Template

Use this template when creating Jira issues to maintain consistency and clarity.

## Default Template

```markdown
## Context
[Brief explanation of the problem or need that originated this task]

## Objective
[What needs to be accomplished with this implementation]

## Technical Requirements
- [ ] Technical requirement 1
- [ ] Technical requirement 2
- [ ] Technical requirement 3

## Acceptance Criteria
- [ ] Criteria 1 - clear description of what should work
- [ ] Criteria 2 - expected behavior
- [ ] Criteria 3 - necessary validations

## Technical Notes
[Important technical considerations, dependencies, files to be modified, etc.]

## Related Links
- [Related issue](link)
- [Documentation](link)
- [Design/Spec](link)

## Estimate
[Time estimate or story points, if applicable]
```

## Usage Example - Backend Feature

```markdown
## Context
Premium users need a dedicated endpoint to manage their personalized discounts on the platform.

## Objective
Create REST endpoint to allow administrators to manage premium user discounts.

## Technical Requirements
- [ ] Create POST endpoint `/api/billing/discounts` in billing module
- [ ] Implement validation of required fields (userId, discountPercentage, validUntil)
- [ ] Add authentication middleware for admins
- [ ] Integrate with existing DiscountEngineService
- [ ] Add appropriate error handling

## Acceptance Criteria
- [ ] Endpoint accepts valid JSON requests and returns 201 Created
- [ ] Validations reject invalid data with 400 Bad Request
- [ ] Only users with ADMIN role can access the endpoint
- [ ] Created discounts are persisted in database
- [ ] Appropriate logs are generated for audit
- [ ] Unit tests cover success and error cases

## Technical Notes
- Files to modify:
  - `package/billing/http/rest/discount.controller.ts` (new)
  - `package/billing/core/service/discount-engine.service.ts` (expand)
  - `package/billing/billing.module.ts` (register controller)
  
- Dependencies:
  - Issue #123 (database migration needs to be complete)
  - Auth middleware already exists in shared/module/auth

- Patterns:
  - Follow modular architecture defined in ARCHITECTURE-GUIDELINES.md
  - DTOs should be in http/rest/dto/
  - Business logic remains in core/service/

## Related Links
- [Discount Engine Spec](https://confluence.example.com/...)
- [Related issue - Premium Features](PROJ-123)

## Estimate
3 story points (~5-8 hours)
```

## Usage Example - Bug Fix

```markdown
## Context
Users are reporting that when trying to login with valid credentials, they occasionally receive 500 Internal Server Error.

## Objective
Identify and fix the intermittent authentication problem affecting ~5% of logins.

## Technical Requirements
- [ ] Reproduce the error in development environment
- [ ] Add detailed logs in authentication flow
- [ ] Identify root cause (possible race condition in cache)
- [ ] Implement fix
- [ ] Add tests to prevent regression

## Acceptance Criteria
- [ ] Reproducible bug is identified and documented
- [ ] Fix applied without breaking existing functionality
- [ ] Login error 500 rate reduced to < 0.1%
- [ ] Adequate logs added to facilitate future debugging
- [ ] Regression tests added

## Technical Notes
- Initial suspect: Redis cache may have inconsistent TTL
- Check implementation in `package/identity/core/service/auth.service.ts`
- Review production logs from last 7 days
- Consider adding circuit breaker if it's an external dependency issue

## Related Links
- [Original bug report](link)
- [Metrics dashboard](link)
- [Datadog logs](link)

## Estimate
5 story points (~1-2 days)
```

## Tips

1. **Be specific:** More details lead to better team understanding
2. **Use checklists:** They facilitate progress tracking
3. **Link relationships:** Connect issues, PRs and relevant docs
4. **Update during development:** Template is a starting point, not an immutable contract
5. **Adapt to context:** Not every task needs all fields - use good judgment

