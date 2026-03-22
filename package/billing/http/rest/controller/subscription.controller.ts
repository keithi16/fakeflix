import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NotFoundDomainException } from '@tlc/shared-lib/common';
import { AuthGuard } from '@tlc/shared-module/auth';
import { ClsService } from 'nestjs-cls';
import { plainToInstance } from 'class-transformer';
import { SubscriptionService } from '../../../core/service/subscription.service';
import { CreateSubscriptionRequestDto } from '../dto/request/create-subscription.dto';
import { SubscriptionResponseDto } from '../dto/response/subscription-response.dto';
import { UserSubscriptionActiveResponseDto } from '../dto/response/user-subscription-active.dto';

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly clsService: ClsService
  ) {}

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
    @Param('userId') userId: string
  ): Promise<UserSubscriptionActiveResponseDto> {
    const isActive = await this.subscriptionService.isUserSubscriptionActive(userId);
    return plainToInstance(
      UserSubscriptionActiveResponseDto,
      { isActive },
      {
        excludeExtraneousValues: true,
      }
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(
    @Param('id') subscriptionId: string
  ): Promise<SubscriptionResponseDto> {
    try {
      const userId = this.clsService.get('userId');
      const subscription = await this.subscriptionService.cancelSubscription(
        subscriptionId,
        userId
      );
      return plainToInstance(SubscriptionResponseDto, subscription, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundDomainException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  @Post(':id/schedule-cancel')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async scheduleCancel(
    @Param('id') subscriptionId: string
  ): Promise<SubscriptionResponseDto> {
    try {
      const userId = this.clsService.get('userId');
      const subscription = await this.subscriptionService.scheduleCancel(
        subscriptionId,
        userId
      );
      return plainToInstance(SubscriptionResponseDto, subscription, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundDomainException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  @Post(':id/reactivate')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async reactivateSubscription(
    @Param('id') subscriptionId: string
  ): Promise<SubscriptionResponseDto> {
    try {
      const userId = this.clsService.get('userId');
      const subscription = await this.subscriptionService.reactivateSubscription(
        subscriptionId,
        userId
      );
      return plainToInstance(SubscriptionResponseDto, subscription, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundDomainException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }
}
