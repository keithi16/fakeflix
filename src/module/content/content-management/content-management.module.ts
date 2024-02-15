import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { PrismaService } from '@src/shared/module/persistence/prisma/prisma.service';
import { TypeOrmPersistenceModule } from '@src/shared/module/persistence/typeorm/typeorm-persistence.module';
import { ContentManagementService } from './core/service/content-management.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoUploadController } from './http/rest/video-upload.controller';
import { Content } from './persistence/model/content.model';
import { Episode } from './persistence/model/episode.model';
import { Movie } from './persistence/model/movie.model';
import { Thumbnail } from './persistence/model/thumbnail.model';
import { TvShow } from './persistence/model/tv-show.model';
import { Video } from './persistence/model/video.model';
import { ContentRepository } from './persistence/repository/content.repository';
import { MovieRepository } from './persistence/repository/movie.repository';
import { VideoRepository } from './persistence/repository/video.repository';

@Module({
  imports: [
    TypeOrmPersistenceModule,
    TypeOrmModule.forFeature([Content, Movie, Thumbnail, Video, TvShow, Episode]),
  ],
  providers: [
    VideoResolver,
    ContentManagementService,
    ConfigService,
    PrismaService,
    ContentRepository,
    MovieRepository,
    VideoRepository,
  ],
  controllers: [VideoUploadController],
})
export class ContentManagementModule {}
