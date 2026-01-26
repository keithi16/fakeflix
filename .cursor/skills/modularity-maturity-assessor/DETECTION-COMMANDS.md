# Detection Commands Reference

Complete reference for all detection commands used in modularity maturity assessment.

## State Isolation Detection (Principle 8)

### Duplicate Entity Names (CRITICAL)

**Command**:
```bash
rg "@Entity\(" --no-heading -A 1 | rg "name:" | sort
```

**What it detects**: Entity definitions with duplicate names across modules

**Why it matters**: Duplicate entity names cause TypeORM conflicts and violate state isolation

**Example violation**:
```
packages/billing/src/persistence/entity/subscription.entity.ts:  name: 'subscriptions',
packages/content/src/persistence/entity/subscription.entity.ts:  name: 'subscriptions',
```

**How to fix**: Prefix entity names with module identifier
```typescript
// packages/billing/
@Entity({ name: 'billing_subscriptions' })

// packages/content/
@Entity({ name: 'content_subscriptions' })
```

**Reference**: `docs/STATE-ISOLATION.md`

---

### Cross-Module Entity Imports

**Command**:
```bash
rg "from ['\"]@fakeflix/.*?/persistence/entity" packages/
```

**What it detects**: Modules importing entities from other modules

**Why it matters**: Violates state isolation and creates tight coupling

**Example violation**:
```typescript
// packages/content/src/service/video.service.ts
import { User } from '@fakeflix/identity/persistence/entity/user.entity'; // ❌ Violation
```

**How to fix**: Use interfaces and DTOs instead
```typescript
// packages/shared/src/interfaces/identity-user.interface.ts
export interface IdentityUserApi {
  getUserById(userId: string): Promise<UserDto>;
}
```

**Reference**: `docs/STATE-ISOLATION.md`

---

### Cross-Module Database Access

**Command**:
```bash
rg "getConnection\(['\"](?!content-db)[^'\"]+['\"]|from ['\"]typeorm['\"].*?getConnection" packages/content/
```

**What it detects**: Modules accessing other modules' databases

**Why it matters**: Breaks isolation and prevents independent deployment

**How to fix**: Use named connections specific to each module
```typescript
// packages/content/src/persistence/content-persistence.module.ts
TypeOrmModule.forRoot({
  name: 'content-db',
  // ...
})
```

**Reference**: `docs/STATE-ISOLATION.md`

---

## Controller Pattern Detection

### Repository Injection in Controllers (VIOLATION)

**Command**:
```bash
rg "constructor\([^)]*Repository[^)]*\)" packages/*/src/**/*controller*
```

**What it detects**: Controllers directly injecting repositories

**Why it matters**: Controllers should only call services, not data layer

**Example violation**:
```typescript
// ❌ BAD
@Controller('videos')
export class VideoController {
  constructor(
    private readonly videoRepository: VideoRepository // ❌ Violation
  ) {}
}
```

**How to fix**: Inject services instead
```typescript
// ✅ GOOD
@Controller('videos')
export class VideoController {
  constructor(
    private readonly videoService: VideoService // ✅ Correct
  ) {}
}
```

**Reference**: `docs/CODING-PATTERNS.md#controller-responsibilities--lean-pattern`

---

### Fat Controllers (>100 lines)

**Command**:
```bash
find packages -name "*controller*.ts" -exec wc -l {} \; | awk '$1 > 100'
```

**What it detects**: Controllers with excessive lines of code

**Why it matters**: Indicates business logic in controllers instead of services

**How to fix**: Move logic to services, keep controllers thin
```typescript
// ✅ GOOD: Thin controller
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  async create(@Body() dto: CreateVideoDto) {
    return await this.videoService.createVideo(dto); // All logic in service
  }
}
```

**Reference**: `docs/CODING-PATTERNS.md#controller-responsibilities--lean-pattern`

---

## Transaction Management Detection

### Missing @Transactional Decorator

**Command**:
```bash
rg "async (create|update|delete|save|remove)" packages/*/src/**/*service*.ts -A 3 | rg -v "@Transactional"
```

**What it detects**: Write operations without transaction management

**Why it matters**: Data consistency issues and potential corruption

**Example violation**:
```typescript
// ❌ BAD: No transaction
async createVideo(dto: CreateVideoDto) {
  const video = await this.videoRepository.save(dto);
  await this.metadataRepository.save({ videoId: video.id });
  return video;
}
```

**How to fix**: Add @Transactional decorator
```typescript
// ✅ GOOD: With transaction
@Transactional('content-db')
async createVideo(dto: CreateVideoDto) {
  const video = await this.videoRepository.save(dto);
  await this.metadataRepository.save({ videoId: video.id });
  return video;
}
```

**Reference**: `docs/CODING-PATTERNS.md#transaction-management--named-connections`

---

## Repository Pattern Detection

### Services Extending TypeORM Repository (VIOLATION)

**Command**:
```bash
rg "extends Repository" packages/*/src/**/service/
```

**What it detects**: Services directly extending TypeORM Repository

**Why it matters**: Violates repository pattern, creates ORM coupling

**Example violation**:
```typescript
// ❌ BAD
@Injectable()
export class VideoService extends Repository<Video> {
  // ❌ Service should not extend Repository
}
```

**How to fix**: Create separate repository class
```typescript
// ✅ GOOD: Separate repository
@Injectable()
export class VideoRepository extends Repository<Video> {
  // Repository logic
}

@Injectable()
export class VideoService {
  constructor(private readonly videoRepository: VideoRepository) {}
  // Service uses repository
}
```

**Reference**: `docs/CODING-PATTERNS.md#repository-pattern--orm-encapsulation`

---

### Direct TypeORM Usage in Services

**Command**:
```bash
rg "from ['\"]typeorm['\"]" packages/*/src/**/*service*.ts
```

**What it detects**: Services importing directly from TypeORM

**Why it matters**: ORM should be encapsulated in repositories

**Example violation**:
```typescript
// ❌ BAD
import { getRepository } from 'typeorm'; // ❌ In service

@Injectable()
export class VideoService {
  async findVideo(id: string) {
    return getRepository(Video).findOne(id); // ❌ Direct ORM access
  }
}
```

**How to fix**: Use repository abstraction
```typescript
// ✅ GOOD
@Injectable()
export class VideoService {
  constructor(private readonly videoRepository: VideoRepository) {}

  async findVideo(id: string) {
    return this.videoRepository.findOneById(id); // ✅ Via repository
  }
}
```

**Reference**: `docs/CODING-PATTERNS.md#repository-pattern--orm-encapsulation`

---

## Observability Detection (Principle 9)

### Missing Logger Injection

**Command**:
```bash
rg "class.*Service" packages/*/src/**/*service*.ts -A 5 | rg -v "Logger|logger"
```

**What it detects**: Services without logger injection

**Why it matters**: Cannot observe service behavior

**How to fix**: Inject logger
```typescript
// ✅ GOOD
@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  async processVideo(id: string) {
    this.logger.log(`Processing video ${id}`);
    // ...
  }
}
```

**Reference**: `docs/RESILIENCE-OBSERVABILITY.md#observability--monitoring`

---

## Boundary Detection (Principle 1)

### Internal Exports in Package Index

**Command**:
```bash
rg "export.*from.*(entity|repository|service)" packages/*/src/index.ts
```

**What it detects**: Internal implementation details exported from package

**Why it matters**: Breaks encapsulation, exposes implementation

**Example violation**:
```typescript
// ❌ BAD: packages/content/src/index.ts
export { Video } from './persistence/entity/video.entity'; // ❌ Internal
export { VideoRepository } from './persistence/repository/video.repository'; // ❌ Internal
export { VideoService } from './core/service/video.service'; // ❌ Internal
```

**How to fix**: Export only facades and modules
```typescript
// ✅ GOOD: packages/content/src/index.ts
export { ContentModule } from './content.module'; // ✅ Public API
export { contentConfigFactory } from './config'; // ✅ Public config
```

**Reference**: `docs/MODULAR-PRINCIPLES.md#1-well-defined-boundaries`

---

## Communication Pattern Detection (Principle 5)

### Missing Interface Definitions

**Command**:
```bash
find packages/shared/src/interfaces -name "*.interface.ts" | wc -l
```

**What it detects**: Existence of inter-module contracts

**Why it matters**: Explicit communication requires defined interfaces

**How to verify**: Check if modules use interfaces from `packages/shared/src/interfaces/`

**Reference**: `docs/MODULAR-PRINCIPLES.md#5-explicit-communication`

---

## Resilience Detection (Principle 10)

### Missing Error Handling

**Command**:
```bash
rg "async.*\{" packages/*/src/**/*service*.ts -A 10 | rg -v "try\s*\{|catch"
```

**What it detects**: Async methods without try-catch blocks

**Why it matters**: Unhandled errors cascade to other modules

**How to fix**: Add proper error handling
```typescript
// ✅ GOOD
async processVideo(id: string) {
  try {
    const video = await this.videoRepository.findOneById(id);
    return await this.process(video);
  } catch (error) {
    this.logger.error(`Failed to process video ${id}`, error);
    throw new VideoProcessingException(error);
  }
}
```

**Reference**: `docs/RESILIENCE-OBSERVABILITY.md#fail-independence`

---

### Missing Circuit Breakers for External APIs

**Command**:
```bash
rg "@Inject.*Client" packages/*/src/ -B 3 -A 10 | rg -v "CircuitBreaker|Timeout"
```

**What it detects**: External API clients without resilience patterns

**Why it matters**: External failures can cascade without protection

**How to fix**: Add circuit breaker
```typescript
// ✅ GOOD
@Injectable()
export class VideoProcessingService {
  constructor(
    @Inject(VideoSummaryGenerationAdapter)
    private readonly externalClient: VideoSummaryGenerationAdapter
  ) {}

  @UseCircuitBreaker({ threshold: 5, timeout: 5000 })
  async generateSummary(videoId: string) {
    return await this.externalClient.generateSummary(videoId);
  }
}
```

**Reference**: `docs/THIRD-PARTY-INTEGRATION.md#resilience-patterns`

---

## Running All Detection Commands

Create a script to run all commands:

```bash
#!/bin/bash
# detection-suite.sh

echo "=== State Isolation ==="
echo "Duplicate Entities:"
rg "@Entity\(" --no-heading -A 1 | rg "name:" | sort

echo -e "\n=== Controller Patterns ==="
echo "Repository Injections:"
rg "constructor\([^)]*Repository[^)]*\)" packages/*/src/**/*controller*

echo -e "\n=== Transactions ==="
echo "Missing @Transactional:"
rg "async (create|update|delete|save|remove)" packages/*/src/**/*service*.ts -A 3 | rg -v "@Transactional"

echo -e "\n=== Boundaries ==="
echo "Internal Exports:"
rg "export.*from.*(entity|repository|service)" packages/*/src/index.ts

# Add more commands as needed
```

**Usage**:
```bash
chmod +x detection-suite.sh
./detection-suite.sh > assessment-results.txt
```

---

## Interpretation Guidelines

### Severity Levels

**Critical (P0)**:
- Duplicate entity names
- Cross-module database access
- Missing transactions on writes
- Data corruption risks

**High (P1)**:
- Repository injection in controllers
- Fat controllers (>100 lines)
- Missing error handling
- No circuit breakers on external APIs

**Medium (P2)**:
- Missing logger injection
- Internal exports
- Direct TypeORM usage in services
- Suboptimal patterns

**Low (P3)**:
- Code organization improvements
- Documentation gaps
- Optimization opportunities

### False Positives

Some patterns may be detected but are acceptable:

1. **Test files**: Detection commands may flag test setup code
2. **Configuration files**: May have patterns that look like violations
3. **Migration files**: Database migrations need direct TypeORM access
4. **Shared utilities**: May have different patterns

Always verify context before marking as violation.

---

**Last Updated**: January 2026
**Maintained By**: Architecture Team
