import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from '@src/module/identity/core/entity/user.entity';
import { UserRepository } from '@src/module/identity/persistence/repository/user.repository';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { ConfigService } from '@src/shared/module/config/config.service';
import { PrismaService } from '@src/shared/module/persistence/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let module: TestingModule;
  let prismaService: PrismaService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [PrismaService, ConfigService, UserRepository],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    await prismaService.user.deleteMany();

    module.close();
  });

  describe('findOneBy', () => {
    it('returns undefined if no user is found', async () => {
      const fields = { id: randomUUID() };

      const result = await userRepository.findOneBy(fields);

      expect(result).toBeUndefined();
    });

    it('returns a UserEntity if a user is found', async () => {
      const user = await prismaService.user.create({
        data: {
          id: randomUUID(),
          firstName: 'test',
          lastName: 'test',
          email: 'test@mail.com',
          password: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      const fields = { id: user.id };

      const result = await userRepository.findOneBy(fields);

      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.getId()).toBe(user.id);
    });

    it('throws an error if an error occurs', async () => {
      //forces error
      const fields = { some: 'invalid' } as any;

      const promise = userRepository.findOneBy(fields);

      await expect(promise).rejects.toThrow();
    });
  });
});
