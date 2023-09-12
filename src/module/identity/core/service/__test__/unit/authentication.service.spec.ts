import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from '@src/module/identity/core/entity/user.entity';
import { UserUnauthorizedException } from '@src/module/identity/core/exception/user-unauthorized.exception';
import { AuthService } from '@src/module/identity/core/service/authentication.service';
import { Email } from '@src/module/identity/core/value-object/email.value-object';
import { UserRepository } from '@src/module/identity/persistence/repository/user.repository';

describe('AuthenticationService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('signIn', () => {
    it('returns an access token with valid credentials', async () => {
      const user = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'testpassword',
      };
      const token = 'testtoken';
      userRepository.findOne = jest.fn().mockResolvedValue(await UserEntity.create(user));
      jwtService.signAsync = jest.fn().mockResolvedValue(token);

      const result = await authService.signIn(new Email(user.email), 'testpassword');

      expect(userRepository.findOne).toHaveBeenCalledWith({ email: user.email });
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: token });
    });

    it('throws an UnauthorizedException with invalid credentials', async () => {
      const user = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'testpassword',
      };
      userRepository.findOne = jest.fn().mockResolvedValue(await UserEntity.create(user));

      await expect(
        authService.signIn(new Email(user.email), 'invalidpassword')
      ).rejects.toThrow(UserUnauthorizedException);
    });
  });
});
