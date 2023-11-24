import { Module } from '@nestjs/common';
import { ContentRepository } from '@src/module/content/shared/persistence/repository/content.repository';
import { VideoRepository } from '@src/module/content/shared/persistence/repository/video.repository';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';
import { CatalogueService } from './core/service/catalogue.service';
import { MediaPlayerService } from './core/service/media-player.service';
import { MediaPlayerController } from './http/rest/media-player.controller';

@Module({
  providers: [
    CatalogueService,
    MediaPlayerService,
    PrismaService,
    ConfigService,
    VideoRepository,
    ContentRepository,
  ],
  controllers: [MediaPlayerController],
})
export class ContentStreamingModule {}
