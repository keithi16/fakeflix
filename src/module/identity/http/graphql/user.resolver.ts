import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserManagementService } from '@src/module/identity/core/service/user-management.service';
import {
  AuthGuard,
  AuthenticatedRequest,
} from '@src/module/identity/http/guard/auth.guard';
import { CreateUserInput } from './dto/create-user-input.dto';
import { User } from './dto/user.dto';

@Resolver()
export class UserResolver {
  constructor(private readonly userManagementService: UserManagementService) {}
  @Mutation(() => User)
  async createUser(
    @Args('CreateUserInput') createUserInput: CreateUserInput
  ): Promise<User> {
    const user = await this.userManagementService.create(createUserInput);
    return user.serialize();
  }

  @Query(() => User)
  @UseGuards(AuthGuard)
  async getProfile(
    @Context('req')
    req: AuthenticatedRequest
  ): Promise<User> {
    return req.user.serialize();
  }
}
