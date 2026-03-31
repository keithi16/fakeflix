import { Injectable } from '@nestjs/common'
import { ContentCatalogApi, ContentCatalogItem } from '@tlc/shared-module/public-api'
import { ListCatalogContentUseCase } from '../../core/use-case/list-catalog-content.use-case'

@Injectable()
export class ContentCatalogFacade implements ContentCatalogApi {
  constructor(private readonly listCatalogContentUseCase: ListCatalogContentUseCase) {}

  findAllWithGenres(): Promise<ContentCatalogItem[]> {
    return this.listCatalogContentUseCase.execute()
  }
}
