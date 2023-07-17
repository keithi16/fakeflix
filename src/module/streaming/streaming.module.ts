import { Module } from '@nestjs/common';
import { VideoResolver } from './http/graphql/video.resolver';
import { DatabaseModule } from '@src/shared/module/database/database.module';
import { VideoUploadService } from './domain/service/video-upload.service';
import { VideoRepository } from './domain/repository/video.repository.interface';
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
