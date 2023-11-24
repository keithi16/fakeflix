import { Module } from '@nestjs/common';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';
import { ContentRepository } from '../shared/persistence/repository/content.repository';
import { ContentManagementService } from './core/service/content-management.service';
import { VideoResolver } from './http/graphql/video.resolver';
import { VideoUploadController } from './http/rest/video-upload.controller';

@Module({
  providers: [
    VideoResolver,
    ContentManagementService,
    ConfigService,
    PrismaService,
    ContentRepository,
  ],
  controllers: [VideoUploadController],
})
export class ContentManagementModule {}
