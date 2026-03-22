import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { AnalyticsContentType } from '../../../../shared/enum/analytics-content-type.enum';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum ContentPerformanceSortBy {
  TOTAL_VIEWS = 'totalViews',
  UNIQUE_VIEWERS = 'uniqueViewers',
  COMPLETION_COUNT = 'completionCount',
  AVG_COMPLETION = 'avgCompletionPercentage',
  TOTAL_WATCH_TIME = 'totalWatchTimeMs',
}

export class ContentPerformanceQueryDto {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : 1))
  @Min(1)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : 20))
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsEnum(ContentPerformanceSortBy)
  @IsOptional()
  sortBy?: ContentPerformanceSortBy;

  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsEnum(AnalyticsContentType)
  @IsOptional()
  contentType?: AnalyticsContentType;

  @IsISO8601()
  @IsOptional()
  from?: string;

  @IsISO8601()
  @IsOptional()
  to?: string;
}

export class TopBottomContentQueryDto {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : 10))
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsEnum(ContentPerformanceSortBy)
  @IsOptional()
  metric?: ContentPerformanceSortBy = ContentPerformanceSortBy.TOTAL_VIEWS;

  @IsEnum(AnalyticsContentType)
  @IsOptional()
  contentType?: AnalyticsContentType;

  @IsISO8601()
  @IsOptional()
  from?: string;

  @IsISO8601()
  @IsOptional()
  to?: string;
}
