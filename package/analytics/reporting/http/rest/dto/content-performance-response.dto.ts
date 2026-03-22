import { Expose } from 'class-transformer';

export class ContentPerformanceResponseDto {
  @Expose() contentId: string;
  @Expose() contentType: string;
  @Expose() totalViews: number;
  @Expose() uniqueViewers: number;
  @Expose() totalWatchTimeMs: number;
  @Expose() avgCompletionPercentage: number;
  @Expose() completionCount: number;
  @Expose() lastComputedAt: Date;
}

export class ContentPerformanceDetailResponseDto {
  @Expose() contentId: string;
  @Expose() contentType: string;
  @Expose() totalViews: number;
  @Expose() uniqueViewers: number;
  @Expose() totalWatchTimeMs: number;
  @Expose() avgCompletionPercentage: number;
  @Expose() completionCount: number;
  @Expose() lastComputedAt: Date;

  @Expose()
  get completionRate(): number {
    if (this.totalViews === 0) return 0;
    return (this.completionCount / this.totalViews) * 100;
  }

  @Expose()
  get avgWatchTimeMs(): number {
    if (this.totalViews === 0) return 0;
    return this.totalWatchTimeMs / this.totalViews;
  }
}
