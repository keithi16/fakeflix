import { Injectable } from '@nestjs/common';
import { NewVideo, Video } from '@src/module/streaming/core/entity/video.entity';
import { PrismaService } from '@src/shared/module/database/prisma.service';

@Injectable()
export class VideoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string): Promise<Video | null> {
    const video = await this.prisma.video.findUnique({ where: { id } });

    if (video) {
      return {
        id: video.id,
        name: video.name,
      };
    }

    return null;
  }

  async create(newVideo: NewVideo): Promise<Video> {
    const video = await this.prisma.video.create({ data: newVideo });

    return {
      id: video.id,
      name: video.name,
    };
  }
}
