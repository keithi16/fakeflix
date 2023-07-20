import { Module } from '@nestjs/common';
import { DatabaseModule } from '@src/shared/module/database/database.module';
import { VideoRepository } from './domain/repository/video.repository.interface';
import { VideoUploadService } from './domain/service/video-upload.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoPrismaRepository } from './storage/repository/video.prisma-repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    VideoResolver,
    VideoUploadService,
    {
      provide: VideoRepository,
      useClass: VideoPrismaRepository,
    },
  ],
})
export class StreamingModule {}
