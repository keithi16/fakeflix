import { Module } from '@nestjs/common';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { EventEmitterModule } from '@src/shared/module/event/event-emitter.module';
import { ContentManagementService } from './core/service/content-management.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoUploadController } from './http/rest/video-upload.controller';
import { ContentManagementPersistenceModule } from './persistence/content-management-persistence.module';

@Module({
  imports: [
    ContentManagementPersistenceModule,
    EventEmitterModule,
    ConfigModule.forRoot(),
  ],
  providers: [VideoResolver, ContentManagementService],
  controllers: [VideoUploadController],
})
export class ContentManagementModule {}
