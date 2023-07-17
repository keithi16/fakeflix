import { Inject, Injectable } from '@nestjs/common';
import { NewVideo, Video } from '@src/module/streaming/domain/entity/video.entity';
import { VideoRepository } from '@src/module/streaming/domain/repository/video.repository.interface';
import { PrismaService } from '@src/shared/module/database/prisma.service';

@Injectable()
export class VideoPrismaRepository implements VideoRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
