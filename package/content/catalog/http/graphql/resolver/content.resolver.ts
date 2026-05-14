import { Query, Resolver } from '@nestjs/graphql';
import { ListContentUseCase } from '../../../core/use-case/list-content.use-case';

import { Content } from '../type/content.type';

@Resolver(() => Content)
export class ContentResolver {
  constructor(private readonly listContentUseCase: ListContentUseCase) {}
  @Query(() => [Content])
  async listContent(): Promise<Content[]> {
    const contents = await this.listContentUseCase.execute();
    return contents.map((content) => {
      return {
        id: content.id,
        title: content.title,
        description: content.description,
        type: content.type,
        genres: content.genres,
        releaseDate: content.releaseDate,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      };
    });
  }
}
