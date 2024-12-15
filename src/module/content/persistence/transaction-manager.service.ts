import { Inject, Injectable } from '@nestjs/common';
import { ContentRepository } from '@src/module/content/persistence/repository/content.repository';
import { EpisodeRepository } from '@src/module/content/persistence/repository/episode.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionManagerService {
  content: ContentRepository;
  episode: EpisodeRepository;

  constructor(@Inject(DataSource) readonly dataSource: DataSource) {}

  async executeWithinTransaction<T>(work: () => Promise<T>): Promise<T> {
    // Start a transaction
    return this.dataSource.transaction(async (transactionManager) => {
      // Re-init repositories with the transaction-aware manager.
      this.content = new ContentRepository(transactionManager);
      this.episode = new EpisodeRepository(transactionManager);

      // Execute the work. If this throws, the transaction is rolled back.
      return work();
    });
  }
}
