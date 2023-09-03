import { Injectable } from '@nestjs/common';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { PrismaService } from '@src/shared/module/database/prisma.service';

@Injectable()
export class VideoRepository {
  private readonly video: PrismaService['video'];
  constructor(prismaService: PrismaService) {
    this.video = prismaService.video;
  }

  async findAll(): Promise<VideoEntity[]> {
    return (await this.video.findMany()).map((video) => new VideoEntity(video));
  }

  async findOne(id: string): Promise<VideoEntity | null> {
    const video = await this.video.findUnique({ where: { id } });

    if (video) {
      return new VideoEntity(video);
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
