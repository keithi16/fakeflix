import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { AnalyticsContentType } from '../../../../shared/enum/analytics-content-type.enum';

export class ExportQueryDto {
  @IsISO8601()
  @IsOptional()
  from?: string;

  @IsISO8601()
  @IsOptional()
  to?: string;

  @IsEnum(AnalyticsContentType)
  @IsOptional()
  contentType?: AnalyticsContentType;
}
