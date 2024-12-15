import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { SubscriptionService } from '@src/module/billing/core/service/subscription.service';
import { CreateSubscriptionRequestDto } from '@src/module/billing/http/rest/dto/request/create-subscription.dto';
import { SubscriptionResponseDto } from '@src/module/billing/http/rest/dto/response/subscription-response.dto';
import { UserSubscriptionActiveResponseDto } from '@src/module/billing/http/rest/dto/response/user-subscription-active.dto';
import { NotFoundDomainException } from '@src/shared/core/exeption/not-found-domain.exception';
import { plainToInstance } from 'class-transformer';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
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
        { ...createdSubscription, ...{ plan: createdSubscription.Plan } },
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
