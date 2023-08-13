import { Module } from '@nestjs/common';
import { DatabaseModule } from '@src/shared/module/database/database.module';
import { VideoManagerService } from './core/service/video-manager.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoUploadController } from './http/rest/controller/video-upload.controller';
import { VideoRepository } from './storage/repository/video.repository';

@Module({
  imports: [DatabaseModule],
  providers: [VideoResolver, VideoManagerService, VideoRepository],
  controllers: [VideoUploadController],
})
export class AdminModule {}
