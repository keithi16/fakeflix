import { Injectable } from '@nestjs/common';
import { DefaultPrismaRepository } from '@src/shared/module/persistence/default.prisma.repository';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';
import { TestEntity, TestEntityProps } from './test.entity';

@Injectable()
export class TestRepository extends DefaultPrismaRepository<TestEntity, TestEntityProps> {
  constructor(prismaService: PrismaService) {
    super(prismaService.test, TestEntity);
  }
}
