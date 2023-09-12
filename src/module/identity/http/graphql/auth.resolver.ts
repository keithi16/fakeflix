import { UnauthorizedException } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from '@src/module/identity/core/service/authentication.service';
import { Email } from '@src/module/identity/core/value-object/email.value-object';
import { AuthToken } from './dto/auth-token.dto';
import { SignInInput } from './dto/sign-in-input.dto';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}
  @Mutation(() => AuthToken)
  async signIn(@Args('SignInInput') signInInput: SignInInput): Promise<AuthToken> {
    const { email, password } = signInInput;
    try {
      const token = await this.authService.signIn(new Email(email), password);
      return token;
    } catch (error) {
      throw new UnauthorizedException('Cannot authorize user');
    }
  }
}
