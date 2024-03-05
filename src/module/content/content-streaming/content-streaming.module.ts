import { Module } from '@nestjs/common';

import { ConfigService } from '@src/shared/module/config/config.service';
import { DynamoDBPersistenceModule } from '@src/shared/module/persistence/dynamodb/dynamodb.module';
import { CatalogueService } from './core/service/catalogue.service';
import { ContentIndexingService } from './core/service/content-indexing.service';
import { MediaPlayerService } from './core/service/media-player.service';
import { ContentProcessingEventHandler } from './event/content-processing.event-handler';
import { MediaPlayerController } from './http/rest/media-player.controller';
import { ContentRepository } from './persistence/repository/content.repository';

@Module({
  imports: [DynamoDBPersistenceModule],
  providers: [
    CatalogueService,
    MediaPlayerService,
    ConfigService,
    ContentIndexingService,
    ContentProcessingEventHandler,
    ContentRepository,
  ],
  controllers: [MediaPlayerController],
})
export class ContentStreamingModule {}
