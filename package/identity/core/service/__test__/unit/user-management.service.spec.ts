import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { UserRepository } from '../../../../persistence/repository/user.repository';
import { UserManagementService } from '../../user-management.service';
import { identityConfigFactory } from '../../../../config';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

import { hash } from 'bcrypt';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [identityConfigFactory],
        }),
      ],
      providers: [
        UserManagementService,
        {
          provide: UserRepository,
          useValue: {
            save: jest.fn(),
          },
        },
      ],
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

      (hash as jest.Mock).mockResolvedValueOnce('hashed_password');
      jest.spyOn(userRepository, 'save').mockResolvedValueOnce({} as any);

      const createdUser = await service.create(user);
      const { email, firstName, lastName } = createdUser;

      expect(email).toEqual(user.email);
      expect(firstName).toEqual(user.firstName);
      expect(lastName).toEqual(user.lastName);
    });
  });

  describe('create with custom salt rounds', () => {
    let customService: UserManagementService;
    let customUserRepository: UserRepository;

    beforeEach(async () => {
      jest.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UserManagementService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(8),
            },
          },
          {
            provide: UserRepository,
            useValue: {
              save: jest.fn(),
            },
          },
        ],
      }).compile();

      customService = module.get<UserManagementService>(UserManagementService);
      customUserRepository = module.get<UserRepository>(UserRepository);
    });

    it('uses the configured salt rounds from ConfigService', async () => {
      const user = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };

      (hash as jest.Mock).mockResolvedValueOnce('hashed_password');
      jest.spyOn(customUserRepository, 'save').mockResolvedValueOnce({} as any);

      await customService.create(user);

      expect(hash).toHaveBeenCalledWith(user.password, 8);
    });
  });
});
