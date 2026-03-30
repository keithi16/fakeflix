import { Expose } from 'class-transformer';

export class ContinueWatchingItemResponseDto {
  @Expose() contentId: string;
  @Expose() contentType: string;
  @Expose() completionPercentage: number;
  @Expose() resumePositionMs: number;
  @Expose() lastWatchedAt: Date;
}
