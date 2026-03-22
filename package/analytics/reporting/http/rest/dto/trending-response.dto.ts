import { Expose, Type } from 'class-transformer';

export class TrendingItemDto {
  @Expose() contentId: string;
  @Expose() contentType: string;
  @Expose() rank: number;
  @Expose() trendingScore: number;
  @Expose() viewCount: number;
  @Expose() uniqueViewers: number;
}

export class TrendingResponseDto {
  @Expose() windowType: string;
  @Expose() @Type(() => TrendingItemDto) items: TrendingItemDto[];
}
