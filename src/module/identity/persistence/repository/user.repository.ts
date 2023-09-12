import { Injectable } from '@nestjs/common';
import { UserPayload } from '@prisma/client';
import { UserEntity } from '@src/module/identity/core/entity/user.entity';
import { DefaultPrismaRepository } from '@src/shared/module/persistence/default.prisma.repository';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';

@Injectable()
export class UserRepository extends DefaultPrismaRepository<
  UserEntity,
  UserPayload['scalars']
> {
  constructor(prismaService: PrismaService) {
    super(prismaService.user, UserEntity);
  }
}
