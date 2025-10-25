import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { BillingSubscriptionStatusApi } from '@tlc/shared-module/public-api';
import { hashSync } from 'bcrypt';
import { User } from '../../../../persistence/entity/user.entity';
import { UserRepository } from '../../../../persistence/repository/user.repository';
import { UserUnauthorizedException } from '../../../exception/user-unauthorized.exception';
import { AuthService } from '../../authentication.service';

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
            findOneByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: BillingSubscriptionStatusApi,
          useValue: {
            isUserSubscriptionActive: jest.fn().mockResolvedValue(true),
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
      const encryptedPassword = hashSync(user.password, 10);
      userRepository.findOneByEmail = jest
        .fn()
        .mockResolvedValue(new User({ ...user, password: encryptedPassword }));
      jwtService.signAsync = jest.fn().mockResolvedValue(token);

      const result = await authService.signIn(user.email, 'testpassword');

      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(user.email);
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
      userRepository.findOne = jest.fn().mockResolvedValue(new User(user));

      await expect(authService.signIn(user.email, 'invalidpassword')).rejects.toThrow(
        UserUnauthorizedException
      );
    });
  });
});
