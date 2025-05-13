import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from '../../../core/service/subscription.service';
import { CreateSubscriptionRequestDto } from '../dto/request/create-subscription.dto';
import { SubscriptionResponseDto } from '../dto/response/subscription-response.dto';
import { UserSubscriptionActiveResponseDto } from '../dto/response/user-subscription-active.dto';
import { NotFoundDomainException } from '@tlc/shared-lib/core/exeption/not-found-domain.exception';
import { AuthGuard } from '@tlc/shared-module/auth/http/guard/auth.guard';
import { plainToInstance } from 'class-transformer';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createSubscription(
    @Body() createSubscriptionRequest: CreateSubscriptionRequestDto
  ): Promise<SubscriptionResponseDto> {
    try {
      const createdSubscription = await this.subscriptionService.createSubscription(
        createSubscriptionRequest
      );
      //TODO validate
      return plainToInstance(
        SubscriptionResponseDto,
        { ...createdSubscription, ...{ plan: createdSubscription.plan } },
        {
          excludeExtraneousValues: true,
        }
      );
    } catch (error) {
      if (error instanceof NotFoundDomainException) {
        throw new NotFoundException(error.message);
      }
      console.error('Error creating subscription', error);
      throw new InternalServerErrorException();
    }
  }

  @Get('/user/:userId')
  async getSubscriptionByUserId(userId: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptionService.getSubscriptionByUserId(userId);
    return plainToInstance(SubscriptionResponseDto, subscription, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/user/:userId/active')
  async isUserSubscriptionActive(
    userId: string
  ): Promise<UserSubscriptionActiveResponseDto> {
    const isActive = this.subscriptionService.isUserSubscriptionActive(userId);
    return plainToInstance(
      UserSubscriptionActiveResponseDto,
      { isActive },
      {
        excludeExtraneousValues: true,
      }
    );
  }
}
