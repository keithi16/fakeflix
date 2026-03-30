import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@tlc/shared-module/auth';
import { plainToInstance } from 'class-transformer';
import { ClsService } from 'nestjs-cls';
import { ContinueWatchingService } from '../../../core/service/continue-watching.service';
import { PersonalizedRecommendationService } from '../../../core/service/personalized-recommendation.service';
import { ContinueWatchingItemResponseDto } from '../dto/continue-watching-item.response-dto';
import { RecommendationItemResponseDto } from '../dto/recommendation-item.response-dto';
import { OptionalAuthGuard } from '../guard/optional-auth.guard';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly clsService: ClsService,
    private readonly personalizedRecommendationService: PersonalizedRecommendationService,
    private readonly continueWatchingService: ContinueWatchingService,
  ) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  async getRecommendations(): Promise<RecommendationItemResponseDto[]> {
    const userId = this.clsService.get<string | undefined>('userId') ?? null;
    const results = await this.personalizedRecommendationService.getForUser(userId);
    return plainToInstance(RecommendationItemResponseDto, results, {
      excludeExtraneousValues: true,
    });
  }

  @Get('continue-watching')
  @UseGuards(AuthGuard)
  async getContinueWatching(): Promise<ContinueWatchingItemResponseDto[]> {
    const userId = this.clsService.get<string>('userId');
    if (!userId) throw new UnauthorizedException();
    const results = await this.continueWatchingService.getForUser(userId);
    return plainToInstance(ContinueWatchingItemResponseDto, results, {
      excludeExtraneousValues: true,
    });
  }

  @Delete('continue-watching/:contentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  async dismissContinueWatching(@Param('contentId') contentId: string): Promise<void> {
    const userId = this.clsService.get<string>('userId');
    if (!userId) throw new UnauthorizedException();
    await this.continueWatchingService.dismissItem(userId, contentId);
  }
}
