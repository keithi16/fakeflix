import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { EventEmitterModule } from '@src/shared/module/event/event-emitter.module';
import { TypeOrmPersistenceModule } from '@src/shared/module/persistence/typeorm/typeorm-persistence.module';
import { ContentManagementService } from './core/service/content-management.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoUploadController } from './http/rest/video-upload.controller';
import { Content } from './persistence/entity/content.entity';
import { Episode } from './persistence/entity/episode.entity';
import { Movie } from './persistence/entity/movie.entity';
import { Thumbnail } from './persistence/entity/thumbnail.entity';
import { TvShow } from './persistence/entity/tv-show.entity';
import { Video } from './persistence/entity/video.entity';
import { ContentRepository } from './persistence/repository/content.repository';
import { MovieRepository } from './persistence/repository/movie.repository';
import { VideoRepository } from './persistence/repository/video.repository';

@Module({
  imports: [
    TypeOrmPersistenceModule,
    TypeOrmModule.forFeature([Content, Movie, Thumbnail, Video, TvShow, Episode]),
    EventEmitterModule,
  ],
  providers: [
    VideoResolver,
    ContentManagementService,
    ConfigService,
    ContentRepository,
    MovieRepository,
    VideoRepository,
  ],
  controllers: [VideoUploadController],
})
export class ContentManagementModule {}
