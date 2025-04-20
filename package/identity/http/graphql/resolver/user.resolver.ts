import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserManagementService } from '@tlc/identity/core/service/user-management.service';
import { CreateUserInput } from '@tlc/identity/http/graphql/type/create-user-input.type';
import { User } from '@tlc/identity/http/graphql/type/user.type';
import {
  AuthenticatedRequest,
  AuthGuard,
} from '@tlc/shared-module/auth/http/guard/auth.guard';

@Resolver()
export class UserResolver {
  constructor(private readonly userManagementService: UserManagementService) {}
  @Mutation(() => User)
  async createUser(
    @Args('CreateUserInput') createUserInput: CreateUserInput
  ): Promise<User> {
    const user = await this.userManagementService.create(createUserInput);
    return user;
  }

  @Query(() => User)
  @UseGuards(AuthGuard)
  async getProfile(
    @Context('req')
    req: AuthenticatedRequest
  ): Promise<User> {
    const user = await this.userManagementService.getUserById(req.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
