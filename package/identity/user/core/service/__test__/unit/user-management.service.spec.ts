import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@tlc/shared-module/config';
import { User } from '../../../../persistence/entity/user.entity';
import { UserRepository } from '../../../../persistence/repository/user.repository';
import { UserManagementService } from '../../user-management.service';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
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

      jest.spyOn(userRepository, 'save').mockResolvedValueOnce({} as User);

      const createdUser = await service.create(user);
      const { email, firstName, lastName } = createdUser;

      expect(email).toEqual(user.email);
      expect(firstName).toEqual(user.firstName);
      expect(lastName).toEqual(user.lastName);
    });
  });
});
