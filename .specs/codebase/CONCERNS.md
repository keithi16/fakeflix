# Codebase Concerns

**Analysis Date:** 2026-03-30

## Security Considerations

**Hardcoded JWT secret:**

- Risk: Token forgery if source is exposed; no secret rotation capability
- Files: `package/shared/module/auth/auth.module.ts`
- Current mitigation: None — secret is a fixed string in source code
- Recommendations: Load from env var or secret manager; add to app config Zod schema

**Billing subscription HTTP client placeholder auth:**

- Risk: Cross-service subscription checks fail or are unauthenticated
- Files: `package/shared/module/public-api/http/client/billing-subscription-http.client.ts`
- Current mitigation: `Authorization: Bearer PUT SOMETHING` (literal placeholder)
- Recommendations: Implement service-to-service auth (service account token, mTLS, or shared secret from config)

**Admin REST routes without auth guards:**

- Risk: Unauthenticated content uploads and admin mutations
- Files: `package/content/management/http/rest/controller/management-movie.controller.ts`, `management-tv-show.controller.ts`
- Current mitigation: None — `@Controller('admin/...')` but no `@UseGuards(AuthGuard, AdminGuard)`
- Recommendations: Add `AuthGuard` + `AdminGuard` to all admin controllers

**JWT payload missing role claim:**

- Risk: `AdminGuard` checks `role === 'admin'` but `signIn` only puts `{ sub: user.id }` in token — admin routes are effectively inaccessible with real tokens
- Files: `package/identity/core/service/authentication.service.ts`, `package/shared/module/auth/http/guard/admin.guard.ts`
- Current mitigation: E2e tests mock JWT with `role: 'admin'` directly
- Recommendations: Include `role` (or permissions) in JWT payload from user entity

## Tech Debt

**Simulated payment gateway:**

- Issue: `Math.random() > 0.5` determines payment success; not a real integration
- Files: `package/billing/core/service/subscription-billing.service.ts`, `package/billing/http/client/payment-gateway-api/payment-gateway.client.ts`
- Why: Placeholder for development; real gateway integration deferred
- Impact: Billing behavior is non-deterministic; cannot test real payment flows
- Fix approach: Integrate real payment gateway client (Stripe, Braintree, etc.)

**Stub catalog GraphQL/REST:**

- Issue: `listVideos` resolver returns hardcoded data; `ListContentUseCase.execute()` returns `[]`
- Files: `package/content/catalog/http/graphql/resolver/video.resolver.ts`, `package/content/catalog/core/use-case/list-content.use-case.ts`
- Impact: Catalog browsing is non-functional
- Fix approach: Wire use case to content repository

**Unused AWS SDK dependencies:**

- Issue: `@aws-sdk/client-dynamodb` and `aws-sdk` v2 declared but not imported in any TypeScript file
- Files: `package.json` (root)
- Impact: Unnecessary dependency surface, supply-chain risk
- Fix approach: Remove if not planned for near-term use

**Event emitter infrastructure without consumers:**

- Issue: `EventEmitterModule` and `EventEmitterService` are wired but no `@OnEvent` handlers exist in domain code
- Files: `package/shared/module/event/`, `package/content/shared/persistence/persistence.module.ts`
- Impact: Events are emitted to nowhere; dead infrastructure
- Fix approach: Wire domain event handlers or remove unused infrastructure

## Performance Bottlenecks

**Gemini video processing — synchronous file read + base64:**

- Problem: `fs.readFileSync` loads entire video into memory as base64 before sending to Gemini API
- Files: `package/content/media/http/client/gemini-api/gemini-text-extractor.client.ts`
- Cause: Synchronous blocking I/O + full file in memory (base64 increases size ~33%)
- Improvement path: Use async I/O, enforce file size limits, consider streaming or object storage URLs

## Test Coverage Gaps

**Analytics — no unit tests:**

- What's not tested: Core services in `analytics/ingestion`, `analytics/aggregation`, `analytics/reporting`
- Risk: Service logic regressions caught only by slow e2e tests
- Priority: Medium
- Difficulty to test: Low — services are injectable with mockable dependencies

**Billing — no unit tests:**

- What's not tested: `SubscriptionService`, `SubscriptionBillingService`, `UsageBillingService`, etc.
- Risk: Complex billing logic (invoicing, credits, dunning) only covered by e2e
- Priority: High — billing is a critical domain
- Difficulty to test: Low

**Shared modules — no tests:**

- What's not tested: `AuthGuard`, `AdminGuard`, `HttpClient`, `DefaultTypeOrmRepository`, `AppLogger`
- Risk: Cross-cutting concerns affect all domains; breakage cascades
- Priority: Medium
- Difficulty to test: Low for guards and clients; moderate for TypeORM wrapper

## Dependencies at Risk

**`aws-sdk` v2:**

- Risk: AWS SDK v2 is in maintenance mode; v3 modular SDK is the replacement
- Impact: If AWS services are needed, v2 patterns won't match current docs
- Migration plan: Remove if unused; migrate to `@aws-sdk/*` v3 modular packages if needed

**`nock` in production dependencies:**

- Risk: Test-only library bundled with production code
- Impact: Unnecessary runtime dependency
- Migration plan: Move to `devDependencies`

---

_Concerns audit: 2026-03-30_
_Update as issues are fixed or new ones discovered_
