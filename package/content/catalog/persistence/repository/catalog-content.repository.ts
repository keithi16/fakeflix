import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm'
import { DataSource } from 'typeorm'
import { Content } from '../../../shared/core'
import { PublishingStatus } from '../../../shared/core/enum/publishing-status.enum'

const DEFAULT_CATALOG_LIMIT = 100

@Injectable()
export class CatalogContentRepository extends DefaultTypeOrmRepository<Content> {
  constructor(
    @InjectDataSource('content')
    dataSource: DataSource,
  ) {
    super(Content, dataSource.manager)
  }

  async findAll(limit = DEFAULT_CATALOG_LIMIT): Promise<Content[]> {
    return this.find({ where: { publishingStatus: PublishingStatus.PUBLISHED }, take: limit })
  }
}
