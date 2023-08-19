import { Injectable } from '@nestjs/common';
import { VideoEntity } from '@src/module/streaming/shared/core/entity/video.entity';
import { PrismaService } from '@src/shared/module/database/prisma.service';

@Injectable()
export class VideoRepository {
  private readonly video: PrismaService['video'];
  constructor(prismaService: PrismaService) {
    this.video = prismaService.video;
  }

  async findAll(): Promise<VideoEntity[]> {
    return this.video.findMany();
  }

  async findOne(id: string): Promise<VideoEntity | null> {
    const video = await this.video.findUnique({ where: { id } });

    if (video) {
      return video;
    }

    return null;
  }

  async save(newVideo: VideoEntity): Promise<VideoEntity> {
    return this.video.create({ data: newVideo });
  }

  async clear(): Promise<void> {
    await this.video.deleteMany();
  }
}
