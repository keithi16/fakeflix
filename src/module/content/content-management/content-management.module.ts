import { Module } from '@nestjs/common';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { EventEmitterModule } from '@src/shared/module/event/event-emitter.module';
import { ContentManagementService } from './core/service/content-management.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoUploadController } from './http/rest/video-upload.controller';
import { PersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [ConfigModule.forRoot(), PersistenceModule.forRoot(), EventEmitterModule],
  providers: [VideoResolver, ContentManagementService],
  controllers: [VideoUploadController],
})
export class ContentManagementModule {}
