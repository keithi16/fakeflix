import { Test, TestingModule } from '@nestjs/testing';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import {
  StorageClientException,
  StorageInternalException,
} from '@src/shared/core/exception/storage.exception';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { TestEntity } from '@src/shared/module/persistence/__test__/shared/test.entity';
import { TestRepository } from '@src/shared/module/persistence/__test__/shared/test.repository';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';

describe('DefaultPrismaRepository unit test error cases', () => {
  let repository: TestRepository;
  let model: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        ConfigService,
        {
          provide: PrismaService,
          useValue: {
            //mocks the Prisma model
            test: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              deleteMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        TestRepository,
      ],
    }).compile();

    repository = module.get<TestRepository>(TestRepository);
    const prismaService = module.get<PrismaService>(PrismaService);
    model = prismaService.test;
  });

  describe('findAll', () => {
    it('throws a StorageIternalException when an internal error occurs', async () => {
      const errorMessage = 'Database error';

      model.findMany.mockRejectedValue(new Error(errorMessage));

      await expect(repository.findAll()).rejects.toThrow(StorageInternalException);
    });
  });

  describe('findOne', () => {
    it('throws a StorageIternalException when an internal error occurs', async () => {
      const errorMessage = 'Database error';

      model.findFirst.mockRejectedValue(new Error(errorMessage));

      await expect(repository.findOne({ id: '1' })).rejects.toThrow(
        StorageInternalException
      );
    });
  });

  describe('save', () => {
    it('throws a StorageInternalException when an internal error occurs during the create', async () => {
      const errorMessage = 'Database error';

      model.create.mockRejectedValue(new Error(errorMessage));

      await expect(
        repository.save(
          TestEntity.create({
            someField: 'Test Entity',
          })
        )
      ).rejects.toThrow(StorageInternalException);
    });
    it('throws a StorageClientException when a client error occurs during the create', async () => {
      model.create.mockRejectedValue(
        new PrismaClientValidationError('Invalid fields', { clientVersion: '1' })
      );

      await expect(
        repository.save(
          TestEntity.create({
            someField: 'Test Entity',
          })
        )
      ).rejects.toThrow(StorageClientException);
    });
  });

  describe('clear', () => {
    it('throws a StorageIternalException when an internal error occurs', async () => {
      const errorMessage = 'Database error';

      model.deleteMany.mockRejectedValue(new Error(errorMessage));

      await expect(repository.clear()).rejects.toThrow(StorageInternalException);
    });
  });

  describe('General prisma errors', () => {
    it('throws a StorageInternalException when an internal Prisma error occurs during the create', async () => {
      model.create.mockRejectedValue(
        new PrismaClientInitializationError(
          'Error connecting to the database',
          '1',
          'P1000'
        )
      );

      await expect(
        repository.save(
          TestEntity.create({
            someField: 'Test Entity',
          })
        )
      ).rejects.toThrow(StorageInternalException);
    });

    it('throws a StorageInternalException when an known internal Prisma error occurs during the create', async () => {
      model.create.mockRejectedValue(
        /**
         * @description
         * Client Known Request Error is a generic error that is thrown when the client
         * Is sending malformed requests to the database
         */
        new PrismaClientKnownRequestError('Known error', {
          clientVersion: '1',
          code: 'P2000',
        })
      );

      await expect(
        repository.save(
          TestEntity.create({
            someField: 'Test Entity',
          })
        )
      ).rejects.toThrow(StorageInternalException);
    });
    it('throws a StorageInternalException when an unknown internal Prisma error occurs during the create', async () => {
      model.create.mockRejectedValue(
        /**
         * @description
         * Client Unknown Request Error is a generic error that is thrown when the client
         * Is sending malformed requests to the database and Prisma does't have an error code for it
         */
        new PrismaClientUnknownRequestError('Unknown error', {
          clientVersion: '1',
        })
      );

      await expect(
        repository.save(
          TestEntity.create({
            someField: 'Test Entity',
          })
        )
      ).rejects.toThrow(StorageInternalException);
    });
  });
});
