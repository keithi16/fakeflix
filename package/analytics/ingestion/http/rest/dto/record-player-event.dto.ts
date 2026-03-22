import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { AnalyticsContentType } from '../../../../shared/enum/analytics-content-type.enum';
import { AnalyticsEventType } from '../../../../shared/enum/analytics-event-type.enum';

export class RecordPlayerEventDto {
  @IsUUID()
  contentId: string;

  @IsEnum(AnalyticsContentType)
  contentType: AnalyticsContentType;

  @IsEnum(AnalyticsEventType)
  eventType: AnalyticsEventType;

  @IsUUID()
  sessionId: string;

  @IsNumber()
  @Min(0)
  positionMs: number;

  @IsNumber()
  @Min(0)
  durationMs: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsISO8601()
  occurredAt: string;
}
