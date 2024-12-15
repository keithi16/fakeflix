import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
//TEMP as example for class
// eslint-disable-next-line import/no-restricted-paths
import { BillingModule } from '@src/module/billing/billing.module';
// eslint-disable-next-line import/no-restricted-paths
import { BillingPublicApiProvider } from '@src/module/billing/integration/provider/public-api.provider';
import { IdentitySubscriptionRepository } from '@src/module/identity/persistence/external/repository/identity-subscription.repository';
import { DomainModuleIntegrationModule } from '@src/shared/module/integration/domain-module-integration.module';
import { BillingSubscriptionStatusApi } from '@src/shared/module/integration/interface/billing-integration.interface';
import { PersistenceModule } from '@src/shared/module/persistence/prisma/persistence.module';
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
    PersistenceModule,
    DomainModuleIntegrationModule,
    BillingModule,
  ],
  providers: [
    {
      provide: BillingSubscriptionStatusApi,
      useExisting: BillingPublicApiProvider,
    },
    AuthService,
    AuthResolver,
    UserResolver,
    UserManagementService,
    UserRepository,
    IdentitySubscriptionRepository,
  ],
})
export class IdentityModule {}
