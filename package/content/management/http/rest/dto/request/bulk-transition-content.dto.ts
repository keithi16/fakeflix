import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsUUID } from 'class-validator';
import { PublishingStatus } from '../../../../../shared/core/enum/publishing-status.enum';

export class BulkTransitionContentDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  contentIds: string[];

  @IsEnum(PublishingStatus)
  targetState: PublishingStatus;
}
