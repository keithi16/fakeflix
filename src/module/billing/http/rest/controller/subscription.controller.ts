import {
  Body,
  Controller,
  InternalServerErrorException,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { SubscriptionService } from '@src/module/billing/core/service/subscription.service';
import { CreateSubscriptionRequestDto } from '@src/module/billing/http/rest/dto/request/create-subscription.dto';
import { CreateSubscriptionResponseDto } from '@src/module/billing/http/rest/dto/response/create-subscription-response.dto';
import { NotFoundDomainException } from '@src/shared/core/exeption/not-found-domain.exception';
import { plainToInstance } from 'class-transformer';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  async createSubscription(
    @Body() createSubscriptionRequest: CreateSubscriptionRequestDto
  ): Promise<CreateSubscriptionResponseDto> {
    try {
      const createdSubscription = await this.subscriptionService.createSubscription(
        createSubscriptionRequest
      );
      //TODO validate
      return plainToInstance(
        CreateSubscriptionResponseDto,
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
}
