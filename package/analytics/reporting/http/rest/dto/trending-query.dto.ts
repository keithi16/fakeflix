import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { AnalyticsContentType } from '../../../../shared/enum/analytics-content-type.enum';
import { AnalyticsTrendingWindowType } from '../../../../shared/enum/analytics-trending-window-type.enum';

export class TrendingQueryDto {
  @IsEnum(AnalyticsTrendingWindowType)
  @IsOptional()
  windowType?: AnalyticsTrendingWindowType = AnalyticsTrendingWindowType.DAILY;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : 20))
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsEnum(AnalyticsContentType)
  @IsOptional()
  contentType?: AnalyticsContentType;
}
