import { Injectable } from '@nestjs/common';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { DefaultPrismaRepository } from '@src/shared/module/persistence/default.prisma.repository';

import { PrismaService } from '@src/shared/module/persistence/prisma.service';

@Injectable()
export class VideoRepository extends DefaultPrismaRepository {
  private readonly model: PrismaService['video'];

  constructor(prismaService: PrismaService) {
    super();
    this.model = prismaService.video;
  }

  async findAll(): Promise<VideoEntity[]> {
    try {
      const videosData = await this.model.findMany();
      return videosData.map((videoData) => VideoEntity.createFrom(videoData));
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }

  async findById(id: string): Promise<VideoEntity | null> {
    try {
      const videoData = await this.model.findUnique({
        where: { id },
      });
      if (!videoData) {
        return null;
      }

      return VideoEntity.createFrom(videoData);
    } catch (error) {
      this.handleAndThrowError(error);
    }
  }
}
