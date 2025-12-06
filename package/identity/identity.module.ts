import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthModule } from '@tlc/shared-module/auth';
import {
  BillingSubscriptionHttpClient,
  BillingSubscriptionStatusApi,
  PublicApiModule,
} from '@tlc/shared-module/public-api';

// Authentication domain
import { AuthService } from './authentication/core/service/authentication.service';
import { AuthResolver } from './authentication/http/graphql/resolver/auth.resolver';

// User domain
import { UserManagementService } from './user/core/service/user-management.service';
import { UserResolver } from './user/http/graphql/resolver/user.resolver';
import { UserRepository } from './user/persistence/repository/user.repository';

// Shared infrastructure
import { IdentityPersistenceModule } from './shared/persistence/identity-persistence.module';

const coreServices = [
  AuthService,
  UserManagementService,
];

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      driver: ApolloDriver,
    }),
    IdentityPersistenceModule,
    PublicApiModule,
    AuthModule,
  ],
  providers: [
    {
      provide: BillingSubscriptionStatusApi,
      useExisting: BillingSubscriptionHttpClient,
    },
    ...coreServices,
    AuthResolver,
    UserResolver,
    UserRepository,
  ],
})
export class IdentityModule {}
