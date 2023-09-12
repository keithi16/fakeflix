import { Module } from '@nestjs/common';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';
import { CatalogueService } from './core/service/catalogue.service';
import { MediaPlayerService } from './core/service/media-player.service';
import { MediaPlayerController } from './http/rest/media-player.controller';
import { VideoRepository } from './persistence/repository/video.repository';

@Module({
  providers: [
    CatalogueService,
    MediaPlayerService,
    PrismaService,
    VideoRepository,
    ConfigService,
  ],
  controllers: [MediaPlayerController],
})
export class ContentStreamingModule {}
