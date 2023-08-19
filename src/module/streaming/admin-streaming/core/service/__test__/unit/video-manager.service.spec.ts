import { Test, TestingModule } from '@nestjs/testing';
import { VideoManagerService } from '@src/module/streaming/admin-streaming/core/service/video-manager.service';
import {
  NewVideoEntity,
  VideoEntity,
} from '@src/module/streaming/shared/core/entity/video.entity';
import { VideoRepository } from '@src/module/streaming/shared/storage/repository/video.repository';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { PrismaService } from '@src/shared/module/database/prisma.service';

describe('VideoManagerService', () => {
  let service: VideoManagerService;
  let repository: VideoRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, VideoManagerService, VideoRepository, PrismaService],
    }).compile();

    service = module.get<VideoManagerService>(VideoManagerService);
    repository = module.get<VideoRepository>(VideoRepository);
  });

  describe('createVideo', () => {
    it('saves a new video entity to the database and returns the saved entity', async () => {
      const data: NewVideoEntity = {
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 100,
        duration: 100,
      };
      const newVideo = VideoEntity.create(data);
      jest.spyOn(repository, 'save').mockResolvedValue(newVideo);
      const result = await service.create(newVideo);
      expect(result).toEqual(newVideo);
    });
  });
});
