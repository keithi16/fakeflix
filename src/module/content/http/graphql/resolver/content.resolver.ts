import { Query, Resolver } from '@nestjs/graphql';

import { CatalogueService } from '@src/module/content/core/service/catalogue.service';
import { Content } from '@src/module/content/http/graphql/type/content.type';

@Resolver(() => Content)
export class ContentResolver {
  constructor(private readonly catalogueService: CatalogueService) {}
  @Query(() => [Content])
  async listContent(): Promise<Content[]> {
    const contents = await this.catalogueService.listContent();
    return contents.map((content) => {
      return {
        id: content.getId(),
        title: content.getTitle(),
        description: content.getDescription(),
        type: content.getType(),
        thumbnail: content.getThumbnail()?.serialize(),
        video: content.getMedia()?.getVideo()?.getUrl(),
        createdAt: content.getCreatedAt(),
        updatedAt: content.getUpdatedAt(),
      };
    });
  }
}
