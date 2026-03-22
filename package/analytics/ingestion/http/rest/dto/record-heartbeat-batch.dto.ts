import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HeartbeatItemDto {
  @IsUUID()
  contentId: string;

  @IsUUID()
  sessionId: string;

  @IsNumber()
  @Min(0)
  positionMs: number;

  @IsNumber()
  @Min(0)
  durationMs: number;

  @IsISO8601()
  occurredAt: string;
}

export class RecordHeartbeatBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HeartbeatItemDto)
  heartbeats: HeartbeatItemDto[];
}
