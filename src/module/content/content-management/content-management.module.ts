import { Module } from '@nestjs/common';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';
import { VideoManagementService } from './core/service/video-managament.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoUploadController } from './http/rest/video-upload.controller';
import { VideoRepository } from './persistence/repository/video.repository';

@Module({
  providers: [
    VideoResolver,
    VideoManagementService,
    ConfigService,
    PrismaService,
    VideoRepository,
  ],
  controllers: [VideoUploadController],
})
export class ContentManagementModule {}
