import { Module } from '@nestjs/common';
import { DatabaseModule } from '@src/shared/module/database/database.module';
import { VideoUploadService } from './core/service/video-upload.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoRepository } from './storage/repository/video.repository';

@Module({
  imports: [DatabaseModule],
  providers: [VideoResolver, VideoUploadService, VideoRepository],
})
export class StreamingModule {}
