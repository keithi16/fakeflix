import { Module } from '@nestjs/common';
import { DatabaseModule } from '@src/shared/module/database/database.module';
import { PrismaService } from '@src/shared/module/database/prisma.service';
import { VideoManagerService } from './core/service/video-manager.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoUploadController } from './http/rest/controller/video-upload.controller';
import { VideoRepository } from './storage/repository/video.repository';

const videoRepositoryProvider = {
  provide: VideoRepository,
  useFactory: (prisma: PrismaService) => {
    //this makes sure that only the video prisma model is available
    // withing the video repository
    return new VideoRepository(prisma.video);
  },
  inject: [PrismaService],
};

@Module({
  imports: [DatabaseModule],
  providers: [VideoResolver, VideoManagerService, videoRepositoryProvider],
  controllers: [VideoUploadController],
})
export class StreamingModule {}
