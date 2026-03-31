import { Injectable } from '@nestjs/common'
import { Content } from '../../../shared/core'
import { CatalogContentRepository } from '../../persistence/repository/catalog-content.repository'

@Injectable()
export class ListContentUseCase {
  constructor(private readonly catalogContentRepository: CatalogContentRepository) {}

  async execute(): Promise<Content[]> {
    return this.catalogContentRepository.findAll()
  }
}
