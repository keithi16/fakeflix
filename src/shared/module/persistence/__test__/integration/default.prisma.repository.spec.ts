import { Test, TestingModule } from '@nestjs/testing';
import { StorageClientException } from '@src/shared/core/exception/storage.exception';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { TestEntity } from '@src/shared/module/persistence/__test__/shared/test.entity';
import { TestRepository } from '@src/shared/module/persistence/__test__/shared/test.repository';
import { PersistenceModule } from '@src/shared/module/persistence/persistence.module';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';

const entity1 = TestEntity.create({ someField: 'Entity 1' });
const entity2 = TestEntity.create({ someField: 'Entity 2' });

describe('DefaultPrismaRepository', () => {
  let prisma: PrismaService;
  let repository: TestRepository;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), PersistenceModule],
      providers: [TestRepository],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    repository = module.get<TestRepository>(TestRepository);

    await prisma.$transaction([prisma.test.deleteMany()]);
  });

  afterEach(async () => {
    await prisma.$transaction([prisma.test.deleteMany()]);
  });

  afterAll(() => module.close());

  describe('findAll', () => {
    it('returns all entities', async () => {
      await prisma.test.createMany({
        data: [entity1.serialize(), entity2.serialize()],
      });

      const result = await repository.findAll();

      expect(result).toEqual([entity1, entity2]);
    });
  });
  describe('save', () => {
    it('creates a new entity', async () => {
      const result = await repository.save(entity1);

      expect(result).toEqual(entity1);
      expect(await prisma.test.findMany()).toEqual([entity1.serialize()]);
    });
    it('throws a StorageClientException when an error related to validation occurs', async () => {
      /**
       * @description
       * Forces an error related to validation, someField is string but we're passing a number
       */
      const buggyEntity = TestEntity.create({ someField: 1 as any });
      await expect(repository.save(buggyEntity)).rejects.toThrow(StorageClientException);
    });
  });
  describe('findOne', () => {
    it('finds by a unique field', async () => {
      await prisma.test.createMany({
        data: [entity1.serialize(), entity2.serialize()],
      });

      expect(await repository.findOne({ id: entity1.id })).toEqual(entity1);
    });
  });
  describe('clear', () => {
    it('deletes all entities', async () => {
      await prisma.test.createMany({
        data: [entity1.serialize(), entity2.serialize()],
      });

      await repository.clear();

      expect(await prisma.test.findMany()).toEqual([]);
    });
  });
});
