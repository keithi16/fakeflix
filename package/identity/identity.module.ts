import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
//TEMP as example for class

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { IdentityPersistenceModule } from '@tlc/identity/persistence/identity-persistence.module';
import { DomainModuleIntegrationModule } from '@tlc/shared-module/integration/domain-module-integration.module';
import { BillingSubscriptionHttpClient } from '@tlc/shared-module/integration/http/client/billing-subscription-http.client';
import { BillingSubscriptionStatusApi } from '@tlc/shared-module/integration/interface/billing-integration.interface';
import { AuthService, jwtConstants } from './core/service/authentication.service';
import { UserManagementService } from './core/service/user-management.service';
import { AuthResolver } from './http/graphql/resolver/auth.resolver';
import { UserResolver } from './http/graphql/resolver/user.resolver';
import { UserRepository } from './persistence/repository/user.repository';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60m' },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      driver: ApolloDriver,
    }),
    IdentityPersistenceModule,
    DomainModuleIntegrationModule,
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
