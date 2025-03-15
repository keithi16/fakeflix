import { UnauthorizedException } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from '@tlc/identity/core/service/authentication.service';
import { AuthToken } from '@tlc/identity/http/graphql/type/auth-token.type';
import { SignInInput } from '@tlc/identity/http/graphql/type/sign-in-input.type';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}
  @Mutation(() => AuthToken)
  async signIn(@Args('SignInInput') signInInput: SignInInput): Promise<AuthToken> {
    const { email, password } = signInInput;
    try {
      const token = await this.authService.signIn(email, password);
      return token;
    } catch (error) {
      throw new UnauthorizedException(
        `Cannot authorize user ${(error as Error).message}`
      );
    }
  }
}
