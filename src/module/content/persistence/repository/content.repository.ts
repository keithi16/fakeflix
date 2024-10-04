import { Inject, Injectable } from '@nestjs/common';
import { Content } from '@src/module/content/persistence/entity/content.entity';
import { DefaultTypeOrmRepository } from '@src/shared/module/persistence/typeorm/repository/default-typeorm.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class ContentRepository extends DefaultTypeOrmRepository<Content> {
  constructor(@Inject(DataSource) readonly dataSource: DataSource) {
    super(Content, dataSource);
  }
}
