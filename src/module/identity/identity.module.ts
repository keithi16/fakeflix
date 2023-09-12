import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';
import { AuthService, jwtConstants } from './core/service/authentication.service';
import { UserManagementService } from './core/service/user-management.service';
import { AuthResolver } from './http/graphql/auth.resolver';
import { UserResolver } from './http/graphql/user.resolver';
import { UserRepository } from './persistence/repository/user.repository';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    UserResolver,
    UserManagementService,
    PrismaService,
    ConfigService,
    UserRepository,
  ],
})
export class IdentityModule {}
