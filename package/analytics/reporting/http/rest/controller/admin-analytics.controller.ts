import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AdminGuard, AuthGuard } from '@tlc/shared-module/auth';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { CsvExportService } from '../../../core/service/csv-export.service';
import { ReportingService } from '../../../core/service/reporting.service';
import {
  ContentPerformanceQueryDto,
  TopBottomContentQueryDto,
} from '../dto/content-performance-query.dto';
import {
  ContentPerformanceDetailResponseDto,
  ContentPerformanceResponseDto,
} from '../dto/content-performance-response.dto';
import { ExportQueryDto } from '../dto/export-query.dto';
import { TrendingQueryDto } from '../dto/trending-query.dto';
import { TrendingResponseDto } from '../dto/trending-response.dto';
import {
  UserEngagementDetailResponseDto,
  UserEngagementSummaryResponseDto,
} from '../dto/user-engagement-response.dto';
import { UserEngagementQueryDto } from '../dto/user-engagement-query.dto';

@Controller('analytics/admin')
@UseGuards(AuthGuard, AdminGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class AdminAnalyticsController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly csvExportService: CsvExportService,
  ) {}

  @Get('content-performance')
  async getContentPerformance(@Query() query: ContentPerformanceQueryDto) {
    const result = await this.reportingService.getContentPerformance(query);
    return {
      data: result.data.map((d) =>
        plainToInstance(ContentPerformanceResponseDto, d, { excludeExtraneousValues: true }),
      ),
      pagination: result.pagination,
    };
  }

  @Get('content-performance/top')
  async getTopContent(@Query() query: TopBottomContentQueryDto) {
    const items = await this.reportingService.getTopContent(query);
    return items.map((d) =>
      plainToInstance(ContentPerformanceResponseDto, d, { excludeExtraneousValues: true }),
    );
  }

  @Get('content-performance/bottom')
  async getBottomContent(@Query() query: TopBottomContentQueryDto) {
    const items = await this.reportingService.getBottomContent(query);
    return items.map((d) =>
      plainToInstance(ContentPerformanceResponseDto, d, { excludeExtraneousValues: true }),
    );
  }

  @Get('content-performance/:contentId')
  async getContentPerformanceDetail(@Param('contentId') contentId: string) {
    const item = await this.reportingService.getContentPerformanceDetail(contentId);
    if (!item) throw new NotFoundException(`Content ${contentId} not found`);
    return plainToInstance(ContentPerformanceDetailResponseDto, item, {
      excludeExtraneousValues: true,
    });
  }

  @Get('user-engagement')
  async getUserEngagement(@Query() query: UserEngagementQueryDto) {
    const result = await this.reportingService.getUserEngagement(query);
    return plainToInstance(UserEngagementSummaryResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Get('user-engagement/:userId')
  async getUserEngagementDetail(@Param('userId') userId: string) {
    const result = await this.reportingService.getUserEngagementDetail(userId);
    return plainToInstance(UserEngagementDetailResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Get('trending')
  async getTrending(@Query() query: TrendingQueryDto) {
    const result = await this.reportingService.getTrending(query);
    return plainToInstance(
      TrendingResponseDto,
      { windowType: result.windowType, items: result.items },
      { excludeExtraneousValues: true },
    );
  }

  @Get('export/content-performance')
  async exportContentPerformance(
    @Query() query: ExportQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    await this.csvExportService.exportContentPerformance(query, response);
  }

  @Get('export/user-engagement')
  async exportUserEngagement(
    @Query() query: ExportQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    await this.csvExportService.exportUserEngagement(query, response);
  }
}
