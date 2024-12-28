import { Query, Resolver } from '@nestjs/graphql';
import { ListContentUseCase } from '@src/module/content/application/use-case/list-content.use-case';

import { Content } from '@src/module/content/http/graphql/type/content.type';

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
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      };
    });
  }
}
