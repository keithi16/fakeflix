import { Injectable } from '@nestjs/common'
import { ContentCatalogItem } from '@tlc/shared-module/public-api'
import { CatalogContentRepository } from '../../persistence/repository/catalog-content.repository'

@Injectable()
export class ListCatalogContentUseCase {
  constructor(private readonly catalogContentRepository: CatalogContentRepository) {}

  async execute(): Promise<ContentCatalogItem[]> {
    const items = await this.catalogContentRepository.findAll()
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      genres: item.genres,
      releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
    }))
  }
}
