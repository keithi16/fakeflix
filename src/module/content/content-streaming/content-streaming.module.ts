import { Module } from '@nestjs/common';
import { SharedStreamingModule } from '@src/module/content/shared/streaming-shared.module';
import { ContentCatalogueService } from './core/service/content-catalogue.service';
import { MediaPlayerService } from './core/service/media-player.service';
import { MediaPlayerController } from './http/rest/media-player.controller';

@Module({
  imports: [SharedStreamingModule],
  providers: [ContentCatalogueService, MediaPlayerService],
  controllers: [MediaPlayerController],
})
export class ContentStreamingModule {}
