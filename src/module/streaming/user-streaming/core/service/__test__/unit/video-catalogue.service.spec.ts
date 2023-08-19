import { Test, TestingModule } from '@nestjs/testing';
import { VideoEntity } from '@src/module/streaming/shared/core/entity/video.entity';
import { VideoRepository } from '@src/module/streaming/shared/storage/repository/video.repository';
import { SharedStreamingModule } from '@src/module/streaming/shared/streaming-shared.module';
import { VideoCatalogueService } from '@src/module/streaming/user-streaming/core/service/video-catalogue.service';

describe('VideoCatalogueService', () => {
  let service: VideoCatalogueService;
  let repository: VideoRepository;

  const video1: VideoEntity = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Test Video 1',
    description: 'This is a test video 1',
    videoUrl: 'https://example.com/videos/test1.mp4',
    thumbnailUrl: 'https://example.com/thumbnails/test1.jpg',
    sizeInKb: 1024,
    duration: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const video2: VideoEntity = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d471',
    title: 'Test Video 2',
    description: 'This is a test video 2',
    videoUrl: 'https://example.com/videos/test2.mp4',
    thumbnailUrl: 'https://example.com/thumbnails/test2.jpg',
    sizeInKb: 2048,
    duration: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SharedStreamingModule],
      providers: [VideoCatalogueService],
    }).compile();

    service = module.get<VideoCatalogueService>(VideoCatalogueService);
    repository = module.get<VideoRepository>(VideoRepository);
  });

  describe('listAllVideos', () => {
    it('returns an array of videos', async () => {
      jest.spyOn(repository, 'findAll').mockResolvedValueOnce([video1, video2]);
      const result = await service.list();
      expect(result).toEqual([video1, video2]);
    });
  });

  describe('getVideoInfo', () => {
    it('returns a video entity', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(video1);
      const result = await service.getVideoInfo(video1.id);
      expect(result).toEqual(video1);
    });

    it('returns null if video entity is not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      const result = await service.getVideoInfo('invalid-id');
      expect(result).toBeNull();
    });
  });
});
