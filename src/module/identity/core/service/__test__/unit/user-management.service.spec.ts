import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from '@src/module/identity/core/entity/user.entity';
import { UserManagementService } from '@src/module/identity/core/service/user-management.service';
import { UserRepository } from '@src/module/identity/persistence/repository/user.repository';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserManagementService, UserRepository, PrismaService, ConfigService],
    }).compile();

    service = module.get<UserManagementService>(UserManagementService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('create', () => {
    it('creates a new user', async () => {
      const user = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };

      const createdUser = await UserEntity.create(user);
      jest.spyOn(userRepository, 'save').mockResolvedValueOnce(createdUser);

      const result = await service.create(user);

      expect(result).toEqual(createdUser);
    });
  });
});
