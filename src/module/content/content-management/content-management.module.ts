import { Module } from '@nestjs/common';
import { ExternalMovieRatingClient } from '@src/module/content/content-management/http/client/external-movie-rating/external-movie-rating.client';
import { HttpClient } from '@src/shared/http/client/http.client';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { EventEmitterModule } from '@src/shared/module/event/event-emitter.module';
import { ContentManagementService } from './core/service/content-management.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoUploadController } from './http/rest/video-upload.controller';
import { PersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [ConfigModule.forRoot(), PersistenceModule.forRoot(), EventEmitterModule],
  providers: [
    VideoResolver,
    ContentManagementService,
    ExternalMovieRatingClient,
    HttpClient,
  ],
  controllers: [VideoUploadController],
})
export class ContentManagementModule {}
