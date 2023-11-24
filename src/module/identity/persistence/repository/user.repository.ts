import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserEntity } from '@src/module/identity/core/entity/user.entity';
import { DefaultPrismaRepository } from '@src/shared/module/persistence/default.prisma.repository';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';

type QueryableFields = Prisma.$UserPayload['scalars'];
@Injectable()
export class UserRepository extends DefaultPrismaRepository {
  private readonly model: PrismaService['user'];
  constructor(prismaService: PrismaService) {
    super();
    this.model = prismaService.user;
  }

  async save(user: UserEntity): Promise<void> {
    try {
      await this.model.create({
        data: user.serialize(),
      });
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }

  async findOneBy(fields: Partial<QueryableFields>): Promise<UserEntity | undefined> {
    try {
      const user = await this.model.findFirst({
        where: fields,
      });
      if (!user) {
        return;
      }

      return UserEntity.createFrom(user);
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }

  async clear(): Promise<{ count: number }> {
    try {
      return await this.model.deleteMany();
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }
}
