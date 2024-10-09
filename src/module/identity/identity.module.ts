import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
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
  ],
  providers: [
    AuthService,
    AuthResolver,
    UserResolver,
    UserManagementService,
    UserRepository,
  ],
})
export class IdentityModule {}
