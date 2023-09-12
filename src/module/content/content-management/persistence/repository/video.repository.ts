import { Injectable } from '@nestjs/common';
import { VideoPayload } from '@prisma/client';
import { VideoEntity } from '@src/module/content/content-management/core/entity/video.entity';
import { DefaultPrismaRepository } from '@src/shared/module/persistence/default.prisma.repository';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';

@Injectable()
export class VideoRepository extends DefaultPrismaRepository<
  VideoEntity,
  VideoPayload['scalars']
> {
  constructor(private readonly prismaService: PrismaService) {
    super(prismaService.video, VideoEntity);
  }
}
