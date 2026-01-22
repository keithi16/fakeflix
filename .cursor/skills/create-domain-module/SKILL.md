---
description: Creates complete domain modules following Fakeflix's modular architecture standards including folder structure, configurations, entities, repositories, services, controllers, and compliance verification.
name: Domain Module Generator
---

# Domain Module Generator

You are an expert in creating domain modules that comply with Fakeflix's 10 architectural principles.

## When to Use This Skill

Use this skill when:

- Creating a new domain module from scratch
- User asks to "create a module", "scaffold a module", or "generate a module"
- User mentions needing a new business domain (billing, inventory, notifications, etc.)
- Starting a new bounded context that needs its own database and logic

## Requirements Gathering

Before generating any code, ask the user these questions using the AskQuestion tool:

1. **Module name** (kebab-case, e.g., "billing", "inventory", "notifications")
2. **Architecture pattern**:
   - Flat module (single domain, like billing)
   - Subdomain-based (multiple subdomains under one domain, like content)
3. **Initial entities** (comma-separated list, e.g., "Customer, Order, Payment")
4. **External integrations** (any third-party services? e.g., "Stripe, SendGrid")
5. **Async processing needs** (will it use queues? yes/no)

## Architecture Decision Tree

```
Does the module have multiple distinct subdomains that could scale independently?
├─ YES → Use Subdomain-Based Pattern (Pattern 2)
│         Examples: Content (admin, catalog, processor), Commerce (cart, checkout, fulfillment)
│
└─ NO → Use Flat Module Pattern (Pattern 1)
          Examples: Billing, Identity, Notifications
```

**Guidelines**:
- **Flat Module**: Single cohesive domain with 3-8 entities
- **Subdomain-Based**: Multiple subdomains with 10+ entities or subdomains that could become separate services

## Folder Structure Generation

### Pattern 1: Flat Module

Generate this structure for single-domain modules:

```
package/{module-name}/
├── core/
│   ├── enum/                     # Domain enumerations
│   ├── interface/                # TypeScript interfaces
│   └── service/                  # Business logic services
├── http/
│   ├── client/                   # External API clients (if needed)
│   │   └── {service}-api/
│   │       └── {service}.client.ts
│   └── rest/
│       ├── controller/           # REST controllers
│       └── dto/
│           ├── request/          # Request DTOs
│           └── response/         # Response DTOs
├── persistence/
│   ├── entity/                   # TypeORM entities
│   ├── repository/               # Data repositories
│   ├── migration/                # Database migrations
│   ├── {module}-persistence.module.ts
│   ├── typeorm-datasource.ts
│   └── typeorm-datasource.factory.ts
├── health/                       # Health indicators (if external deps)
│   └── {service}-health.indicator.ts
├── public-api/                   # Public facades (if needed by other modules)
│   └── facade/
│       └── {module}.facade.ts
├── {module}.module.ts            # Main module definition
├── config.ts                     # Configuration with Zod
├── index.ts                      # Public exports
├── package.json
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── jest.config.ts
└── eslint.config.mjs
```

### Pattern 2: Subdomain-Based Module

Generate this structure for multi-subdomain modules:

```
package/{module-name}/
├── {subdomain-1}/
│   ├── {subdomain}.module.ts
│   ├── core/
│   │   ├── use-case/             # Application use cases
│   │   └── service/              # Domain services
│   ├── http/
│   │   ├── rest/
│   │   │   ├── controller/
│   │   │   └── dto/
│   │   │       ├── request/
│   │   │       └── response/
│   │   └── client/               # Subdomain-specific clients
│   ├── persistence/
│   │   └── repository/           # Subdomain-specific repositories
│   └── queue/                    # Queue producers/consumers (if needed)
│       ├── producer/
│       └── consumer/
├── {subdomain-2}/                # Same structure
├── shared/
│   ├── core/
│   │   ├── enum/                 # Shared enums
│   │   ├── exception/            # Domain exceptions
│   │   └── guard/                # Guards
│   ├── persistence/
│   │   ├── entity/               # Shared entities
│   │   ├── migration/
│   │   ├── persistence.module.ts
│   │   ├── typeorm-datasource.ts
│   │   └── typeorm-datasource.factory.ts
│   ├── queue/
│   │   └── queue-constants.ts    # Queue name constants
│   └── {module}-shared.module.ts
├── {module}.module.ts            # Root module orchestrating features
├── config.ts                     # Configuration
├── index.ts                      # Public exports
├── package.json
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── jest.config.ts
└── eslint.config.mjs
```

## Component Generation Instructions

### 1. Configuration (config.ts)

Generate configuration with Zod validation:

```typescript
import { ConfigException, environmentSchema } from '@tlc/shared-module/config';
import { z } from 'zod';

const databaseSchema = z.object({
  host: z.string(),
  database: z.string(),
  password: z.string(),
  port: z.coerce.number(),
  url: z.string().startsWith('postgresql://'),
  username: z.string(),
});

// Add module-specific configurations
const {moduleName} = z.object({
  database: databaseSchema,
  // Add external service configs if needed
  // stripe: z.object({ ... }),
  // redis: z.object({ ... }),
});

export const configSchema = z.object({
  env: environmentSchema,
  {moduleName},
});

export type {ModuleName}Config = z.infer<typeof configSchema>;
export type Config = z.infer<typeof configSchema>;

export const factory = (): Config => {
  const result = configSchema.safeParse({
    env: process.env.NODE_ENV,
    {moduleName}: {
      database: {
        host: process.env.{MODULE_NAME}_DATABASE_HOST,
        database: process.env.{MODULE_NAME}_DATABASE_NAME,
        password: process.env.{MODULE_NAME}_DATABASE_PASSWORD,
        port: process.env.{MODULE_NAME}_DATABASE_PORT,
        url: `postgresql://${process.env.{MODULE_NAME}_DATABASE_USERNAME}:${process.env.{MODULE_NAME}_DATABASE_PASSWORD}@${process.env.{MODULE_NAME}_DATABASE_HOST}:${process.env.{MODULE_NAME}_DATABASE_PORT}/${process.env.{MODULE_NAME}_DATABASE_NAME}`,
        username: process.env.{MODULE_NAME}_DATABASE_USERNAME,
      },
    },
  });

  if (result.success) {
    return result.data;
  }

  throw new ConfigException(`Invalid application configuration: ${result.error.message}`);
};
```

**Key points**:
- Use uppercase for environment variables: `{MODULE_NAME}_DATABASE_HOST`
- Use camelCase for config keys: `{moduleName}.database.host`
- Add external service configs only if needed
- Export factory as named export for use in modules

### 2. Entities (persistence/entity/)

**CRITICAL**: Always use module-prefixed entity names!

```typescript
import { Column, Entity, Index } from 'typeorm';
import { DefaultEntity } from '@tlc/shared-module/typeorm';

// ✅ GOOD: Module-prefixed name
@Entity({ name: '{ModuleName}{EntityName}' })
@Index(['userId'])  // Index frequently queried fields
export class {EntityName} extends DefaultEntity<{EntityName}> {
  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}
```

**Naming rules**:
- Entity class: PascalCase without prefix (e.g., `Customer`, `Order`)
- Entity table name: Module prefix + entity name (e.g., `BillingCustomer`, `BillingOrder`)
- Never use generic names: `Plan`, `User`, `Item`, `Content`

### 3. Repositories (persistence/repository/)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { {EntityName} } from '../entity/{entity-name}.entity';

@Injectable()
export class {EntityName}Repository extends DefaultTypeOrmRepository<{EntityName}> {
  constructor(
    @InjectDataSource('{moduleName}')
    dataSource: DataSource
  ) {
    super({EntityName}, dataSource.manager);
  }

  // Add custom query methods with business meaning
  async findByUserId(userId: string): Promise<{EntityName}[]> {
    return this.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByExternalId(externalId: string): Promise<{EntityName} | null> {
    return this.findOne({
      where: { externalId },
    });
  }
}
```

**Key points**:
- Extend `DefaultTypeOrmRepository<Entity>` (NOT TypeORM's Repository)
- Use `@InjectDataSource('{moduleName}')` with module name
- Pass `dataSource.manager` to super constructor
- Add custom query methods, never expose query builder

### 4. Persistence Module (persistence/{module}-persistence.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@tlc/shared-module/config';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { {ModuleName}Config } from '../config';
import { {Entity1}Repository } from './repository/{entity1}.repository';
import { {Entity2}Repository } from './repository/{entity2}.repository';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';

const repositories = [
  {Entity1}Repository,
  {Entity2}Repository,
  // Add all repositories
];

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: '{moduleName}',
      inject: [ConfigService],
      useFactory: (configService: ConfigService<{ModuleName}Config>) => {
        return dataSourceOptionsFactory(configService);
      },
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource({
          name: options.name,
          dataSource: new DataSource(options),
        });
      },
    }),
  ],
  providers: [...repositories],
  exports: [...repositories],
})
export class {ModuleName}PersistenceModule {}
```

### 5. TypeORM DataSource Factory (persistence/typeorm-datasource.factory.ts)

```typescript
import { ConfigService } from '@tlc/shared-module/config';
import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { {ModuleName}Config } from '../config';

export const dataSourceOptionsFactory = (
  configService: ConfigService<{ModuleName}Config>
): DataSourceOptions => {
  return {
    type: 'postgres',
    host: configService.get('{moduleName}.database.host'),
    port: configService.get('{moduleName}.database.port'),
    username: configService.get('{moduleName}.database.username'),
    password: configService.get('{moduleName}.database.password'),
    database: configService.get('{moduleName}.database.database'),
    entities: [join(__dirname, 'entity', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migration', '*-migration.{ts,js}')],
    migrationsTableName: '{moduleName}_migrations',
    synchronize: false,
    logging: configService.get('env') === 'development',
  };
};
```

### 6. TypeORM DataSource (persistence/typeorm-datasource.ts)

```typescript
import { DataSource } from 'typeorm';
import { factory } from '../config';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';

const configService = {
  get: (key: string) => {
    const config = factory();
    const keys = key.split('.');
    let value: any = config;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  },
};

export default new DataSource(
  dataSourceOptionsFactory(configService as any)
);
```

### 7. Services (core/service/)

```typescript
import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { {EntityName}Repository } from '../../persistence/repository/{entity-name}.repository';
import { {EntityName} } from '../../persistence/entity/{entity-name}.entity';

@Injectable()
export class {EntityName}Service {
  constructor(
    private readonly {entityName}Repository: {EntityName}Repository
  ) {}

  // Read operations - no @Transactional needed
  async getById(id: string): Promise<{EntityName} | null> {
    return this.{entityName}Repository.findOne({ where: { id } });
  }

  async getByUserId(userId: string): Promise<{EntityName}[]> {
    return this.{entityName}Repository.findByUserId(userId);
  }

  // Write operations - use @Transactional with connectionName
  @Transactional({ connectionName: '{moduleName}' })
  async create(data: Create{EntityName}Data): Promise<{EntityName}> {
    const entity = new {EntityName}();
    Object.assign(entity, data);
    return this.{entityName}Repository.save(entity);
  }

  @Transactional({ connectionName: '{moduleName}' })
  async update(id: string, data: Update{EntityName}Data): Promise<{EntityName}> {
    const entity = await this.{entityName}Repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('{EntityName} not found');
    }
    Object.assign(entity, data);
    return this.{entityName}Repository.save(entity);
  }

  @Transactional({ connectionName: '{moduleName}' })
  async delete(id: string): Promise<void> {
    await this.{entityName}Repository.delete(id);
  }
}
```

**Key points**:
- Use `@Injectable()` decorator
- Use `@Transactional({ connectionName: '{moduleName}' })` for write operations
- No transaction decorator for read-only operations
- Inject repositories, encapsulate business logic

### 8. Controllers (http/rest/controller/)

Keep controllers lean - under 20 lines per method!

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@tlc/shared-module/auth';
import { ClsService } from 'nestjs-cls';
import { plainToInstance } from 'class-transformer';
import { {EntityName}Service } from '../../../core/service/{entity-name}.service';
import { Create{EntityName}Dto } from '../dto/request/create-{entity-name}.dto';
import { Update{EntityName}Dto } from '../dto/request/update-{entity-name}.dto';
import { {EntityName}ResponseDto } from '../dto/response/{entity-name}-response.dto';

@Controller('{entity-name}')
@UseGuards(AuthGuard)
export class {EntityName}Controller {
  constructor(
    private readonly {entityName}Service: {EntityName}Service,
    private readonly clsService: ClsService
  ) {}

  @Get()
  async findAll(): Promise<{EntityName}ResponseDto[]> {
    const userId = this.clsService.get('userId');
    const entities = await this.{entityName}Service.getByUserId(userId);
    
    return entities.map(entity =>
      plainToInstance({EntityName}ResponseDto, entity, {
        excludeExtraneousValues: true,
      })
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{EntityName}ResponseDto> {
    const entity = await this.{entityName}Service.getById(id);
    
    return plainToInstance({EntityName}ResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  async create(@Body() dto: Create{EntityName}Dto): Promise<{EntityName}ResponseDto> {
    const userId = this.clsService.get('userId');
    const entity = await this.{entityName}Service.create({ ...dto, userId });
    
    return plainToInstance({EntityName}ResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }
}
```

**Key points**:
- Only call services, never repositories
- Extract user context from ClsService
- Transform responses with `plainToInstance()`
- Keep methods under 20 lines
- No business logic in controllers

### 9. DTOs (http/rest/dto/)

**Request DTO**:

```typescript
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class Create{EntityName}Dto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
```

**Response DTO**:

```typescript
import { Expose } from 'class-transformer';

export class {EntityName}ResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
```

### 10. Main Module ({module}.module.ts)

**Flat Module Pattern**:

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@tlc/shared-module/auth';
import { LoggerModule } from '@tlc/shared-module/logger';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ClsModule } from 'nestjs-cls';
import { {Entity1}Service } from './core/service/{entity1}.service';
import { {Entity2}Service } from './core/service/{entity2}.service';
import { {Entity1}Controller } from './http/rest/controller/{entity1}.controller';
import { {Entity2}Controller } from './http/rest/controller/{entity2}.controller';
import { {ModuleName}PersistenceModule } from './persistence/{module-name}-persistence.module';

const coreServices = [
  {Entity1}Service,
  {Entity2}Service,
];

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    PrometheusModule.register(),
    {ModuleName}PersistenceModule,
    AuthModule,
    LoggerModule,
  ],
  providers: [...coreServices],
  controllers: [
    {Entity1}Controller,
    {Entity2}Controller,
  ],
  exports: [...coreServices],
})
export class {ModuleName}Module {}

export { factory as {moduleName}ConfigFactory } from './config';
```

**Subdomain-Based Pattern (Root Module)**:

```typescript
import { Module } from '@nestjs/common';
import { {Subdomain1}Module } from './{subdomain1}/{subdomain1}.module';
import { {Subdomain2}Module } from './{subdomain2}/{subdomain2}.module';

@Module({
  imports: [{Subdomain1}Module, {Subdomain2}Module],
})
export class {ModuleName}Module {}
```

**Subdomain-Based Pattern (Shared Module)**:

```typescript
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { {ModuleName}Config } from '../config';
import { {ModuleName}SharedPersistenceModule } from './persistence/persistence.module';
import { QUEUES } from './queue/queue-constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<{ModuleName}Config>) => ({
        connection: {
          host: configService.get('{moduleName}.redis.host'),
          port: configService.get('{moduleName}.redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUES.QUEUE_NAME_1 },
      { name: QUEUES.QUEUE_NAME_2 }
    ),
    {ModuleName}SharedPersistenceModule,
  ],
  exports: [{ModuleName}SharedPersistenceModule, BullModule],
})
export class {ModuleName}SharedModule {}
```

### 11. Public Exports (index.ts)

```typescript
// Module & Config
export * from './{module-name}.module';
export * from './config';

// Public Enums (if any)
export { {EnumName} } from './core/enum/{enum-name}.enum';

// Public Interfaces (if any)
export type { {InterfaceName} } from './core/interface/{interface-name}.interface';

// Health Indicators (if any)
export { {ServiceName}HealthIndicator } from './health/{service-name}-health.indicator';

// DO NOT export: services, repositories, controllers (internal only)
```

### 12. NX Configuration Files

**package.json**:

```json
{
  "name": "@tlc/{module-name}",
  "version": "0.0.1",
  "description": "{Module} domain module",
  "main": "./index.ts",
  "types": "./index.ts"
}
```

**tsconfig.json**:

```json
{
  "extends": "../../tsconfig.base.json",
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.lib.json"
    },
    {
      "path": "./tsconfig.spec.json"
    }
  ],
  "compilerOptions": {
    "esModuleInterop": true
  }
}
```

**tsconfig.lib.json**:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "declaration": true,
    "types": ["node"]
  },
  "include": ["**/*.ts"],
  "exclude": ["jest.config.ts", "**/*.spec.ts", "**/*.test.ts", "__test__/**/*"]
}
```

**tsconfig.spec.json**:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "module": "commonjs",
    "types": ["jest", "node"]
  },
  "include": ["jest.config.ts", "**/*.test.ts", "**/*.spec.ts", "__test__/**/*"]
}
```

**jest.config.ts**:

```typescript
export default {
  displayName: '{module-name}',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/package/{module-name}',
};
```

**eslint.config.mjs**:

```javascript
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {},
  },
];
```

## Naming Conventions

### Files and Folders

- **Folders**: kebab-case (e.g., `core/service`, `http/rest/controller`)
- **Files**: kebab-case with suffix (e.g., `customer.service.ts`, `customer.controller.ts`)
- **Suffixes**: `.entity.ts`, `.repository.ts`, `.service.ts`, `.controller.ts`, `.dto.ts`, `.interface.ts`, `.enum.ts`, `.module.ts`

### Code

- **Classes**: PascalCase (e.g., `CustomerService`, `Customer`)
- **Interfaces**: PascalCase with optional `I` prefix (e.g., `CustomerApi` or `ICustomerApi`)
- **Enums**: PascalCase (e.g., `CustomerStatus`)
- **Variables/Parameters**: camelCase (e.g., `customerId`, `customerService`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`, `QUEUE_NAME`)
- **Environment Variables**: UPPER_SNAKE_CASE with module prefix (e.g., `BILLING_DATABASE_HOST`)
- **Config Keys**: camelCase nested (e.g., `billing.database.host`)
- **Entity Table Names**: ModulePrefix + EntityName (e.g., `BillingCustomer`)
- **DataSource Name**: camelCase module name (e.g., `'billing'`, `'inventory'`)

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Generic Entity Names

**BAD**:
```typescript
@Entity({ name: 'Plan' })
export class Plan { }

@Entity({ name: 'User' })
export class User { }
```

**GOOD**:
```typescript
@Entity({ name: 'BillingPlan' })
export class Plan { }

@Entity({ name: 'BillingUser' })
export class User { }
```

### ❌ Anti-Pattern 2: Fat Controllers

**BAD**:
```typescript
@Post()
async create(@Body() dto: CreateDto) {
  // ❌ Business logic in controller
  const existing = await this.repository.findOne({ where: { email: dto.email } });
  if (existing) {
    throw new BadRequestException('Already exists');
  }
  
  const entity = new Entity();
  entity.name = dto.name;
  entity.email = dto.email;
  entity.status = 'active';
  
  return this.repository.save(entity);
}
```

**GOOD**:
```typescript
@Post()
async create(@Body() dto: CreateDto) {
  // ✅ Delegate to service
  const entity = await this.service.create(dto);
  return plainToInstance(ResponseDto, entity, { excludeExtraneousValues: true });
}
```

### ❌ Anti-Pattern 3: Repository Injection in Controllers

**BAD**:
```typescript
@Controller('customer')
export class CustomerController {
  constructor(
    private readonly customerRepository: CustomerRepository // ❌
  ) {}
}
```

**GOOD**:
```typescript
@Controller('customer')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService // ✅
  ) {}
}
```

### ❌ Anti-Pattern 4: Missing Transaction Decorators

**BAD**:
```typescript
async createOrder(data: CreateOrderData) {
  const order = await this.orderRepository.save(new Order(data));
  await this.inventoryRepository.decrementStock(data.productId);
  await this.paymentRepository.createCharge(order.id);
  // ❌ No transaction - could fail partially
}
```

**GOOD**:
```typescript
@Transactional({ connectionName: 'orders' })
async createOrder(data: CreateOrderData) {
  const order = await this.orderRepository.save(new Order(data));
  await this.inventoryRepository.decrementStock(data.productId);
  await this.paymentRepository.createCharge(order.id);
  // ✅ All succeed or all rollback
}
```

### ❌ Anti-Pattern 5: Missing connectionName

**BAD**:
```typescript
@Transactional() // ❌ Ambiguous which database
async create(data: any) { }
```

**GOOD**:
```typescript
@Transactional({ connectionName: 'billing' }) // ✅ Explicit
async create(data: any) { }
```

### ❌ Anti-Pattern 6: Extending TypeORM Repository

**BAD**:
```typescript
export class CustomerRepository extends Repository<Customer> {
  // ❌ Exposes 50+ TypeORM methods
}
```

**GOOD**:
```typescript
export class CustomerRepository extends DefaultTypeOrmRepository<Customer> {
  // ✅ Only exposes safe methods
}
```

### ❌ Anti-Pattern 7: Cross-Module Entity Imports

**BAD**:
```typescript
// In billing module
import { User } from '@tlc/identity/persistence/entity/user.entity'; // ❌
```

**GOOD**:
```typescript
// In billing module
// Use string reference instead
subscription.userId = userId; // ✅
// Or use HTTP client to fetch user data
const user = await this.identityClient.getUserById(userId); // ✅
```

## Verification Commands

After generating the module, run these verification commands:

### 1. Check for Duplicate Entity Names (CRITICAL)

```bash
grep -r "@Entity.*name:" packages/ | grep -o "name: '[^']*'" | sort | uniq -d
```

**Expected**: Empty output (no duplicates)

### 2. Verify Named DataSources

```bash
grep -r "@InjectDataSource" packages/{moduleName}/
```

**Expected**: All should use `@InjectDataSource('{moduleName}')`

### 3. Check Transaction Decorators

```bash
grep -r "@Transactional" packages/{moduleName}/ | grep -v "connectionName"
```

**Expected**: Empty output (all should have connectionName)

### 4. Check for Repository Injections in Controllers

```bash
grep -r "Repository" packages/{moduleName}/http/rest/controller/*.ts
```

**Expected**: Empty output (controllers should only inject services)

### 5. Run Build and Lint

```bash
nx lint:check {moduleName}
nx build {moduleName}
```

**Expected**: Both commands succeed

### 6. Generate Initial Migration

```bash
nx db:generate {moduleName}
```

**Expected**: Migration file created in `persistence/migration/`

## Generation Process

Follow these steps in order:

1. **Gather requirements** using AskQuestion tool
2. **Decide architecture pattern** (flat vs subdomain-based)
3. **Create folder structure** for the chosen pattern
4. **Generate config.ts** with Zod schema and environment variables
5. **Generate entities** with module-prefixed names
6. **Generate repositories** extending DefaultTypeOrmRepository
7. **Generate persistence module** with named datasource
8. **Generate TypeORM datasource files**
9. **Generate services** with @Transactional decorators
10. **Generate controllers** (lean, calling services only)
11. **Generate DTOs** (request and response)
12. **Generate main module** with grouped providers
13. **Generate index.ts** with public exports
14. **Generate NX config files** (package.json, tsconfig.*, jest.config.ts, eslint.config.mjs)
15. **Run verification commands** to check compliance
16. **Report results** to user with next steps

## Success Criteria

A successfully generated module should:

- ✅ Pass all verification commands (no violations)
- ✅ Have module-prefixed entity names (e.g., `BillingCustomer`)
- ✅ Use named datasources throughout (`@InjectDataSource('{moduleName}')`)
- ✅ Have lean controllers (<20 lines per method)
- ✅ Use `@Transactional({ connectionName: '{moduleName}' })` for writes
- ✅ Export only public APIs (no services/repositories in index.ts)
- ✅ Build and lint successfully
- ✅ Follow all 10 architectural principles

## Next Steps After Generation

Inform the user to:

1. **Create .env file** with database credentials:
   ```
   {MODULE_NAME}_DATABASE_HOST=localhost
   {MODULE_NAME}_DATABASE_PORT=5432
   {MODULE_NAME}_DATABASE_NAME={module_name}_db
   {MODULE_NAME}_DATABASE_USERNAME=postgres
   {MODULE_NAME}_DATABASE_PASSWORD=password
   ```

2. **Run initial migration**:
   ```bash
   nx db:generate {moduleName}
   nx db:migrate {moduleName}
   ```

3. **Add to app module** (if using in an app):
   ```typescript
   import { {ModuleName}Module, {moduleName}ConfigFactory } from '@tlc/{module-name}';
   
   @Module({
     imports: [
       ConfigModule.forRoot({
         load: [{moduleName}ConfigFactory],
       }),
       {ModuleName}Module,
     ],
   })
   export class AppModule {}
   ```

4. **Write tests** for services and controllers

5. **Add health checks** if using external services

## Important Notes

- Always read the architecture documentation before generating modules
- Module names should match business domains, not technical layers
- Entities MUST have module-prefixed table names (most critical rule)
- Controllers MUST be lean - no business logic
- Services MUST use @Transactional for writes
- Repositories MUST extend DefaultTypeOrmRepository
- Never share databases between modules
- Use events or HTTP clients for cross-module communication
- Follow the principle of state isolation at all costs

## References

- Architecture Overview: `docs/ARCHITECTURE-OVERVIEW.md`
- State Isolation: `docs/STATE-ISOLATION.md`
- Coding Patterns: `docs/CODING-PATTERNS.md`
- Modular Principles: `docs/MODULAR-PRINCIPLES.md`
- Implementation Checklist: `docs/IMPLEMENTATION-CHECKLIST.md`
