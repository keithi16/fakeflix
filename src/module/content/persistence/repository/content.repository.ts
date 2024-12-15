import { Injectable } from '@nestjs/common';
import { Content } from '@src/module/content/persistence/entity/content.entity';
import { DefaultTypeOrmRepository } from '@src/shared/module/persistence/typeorm/repository/default-typeorm.repository';
import { EntityManager } from 'typeorm';

@Injectable()
export class ContentRepository extends DefaultTypeOrmRepository<Content> {
  constructor(readonly transactionalEntityManager: EntityManager) {
    super(Content, transactionalEntityManager);
  }
}
