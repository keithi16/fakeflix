import { Module } from '@nestjs/common';

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthModule } from '@tlc/shared-module/auth';
import {
  BillingSubscriptionHttpClient,
  BillingSubscriptionStatusApi,
  PublicApiModule,
} from '@tlc/shared-module/public-api';
import { AuthService } from './core/service/authentication.service';
import { UserManagementService } from './core/service/user-management.service';
import { AuthResolver } from './http/graphql/resolver/auth.resolver';
import { UserResolver } from './http/graphql/resolver/user.resolver';
import { IdentityPersistenceModule } from './persistence/identity-persistence.module';
import { UserRepository } from './persistence/repository/user.repository';

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
    AuthService,
    AuthResolver,
    UserResolver,
    UserManagementService,
    UserRepository,
  ],
})
export class IdentityModule {}
