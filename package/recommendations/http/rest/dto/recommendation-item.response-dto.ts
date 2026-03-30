import { Expose } from 'class-transformer';

export class RecommendationItemResponseDto {
  @Expose() contentId: string;
  @Expose() title: string;
  @Expose() type: string;
  @Expose() score: number;
  @Expose() rank: number;
  @Expose() matchedGenres: string[];
}
