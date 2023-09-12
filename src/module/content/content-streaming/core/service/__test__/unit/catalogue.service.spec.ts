import { Test, TestingModule } from '@nestjs/testing';
import { ContentStreamingModule } from '@src/module/content/content-streaming/content-streaming.module';
import { VideoEntity } from '@src/module/content/content-streaming/core/entity/video.entity';
import { CatalogueService } from '@src/module/content/content-streaming/core/service/catalogue.service';
import { VideoRepository } from '@src/module/content/content-streaming/persistence/repository/video.repository';
import { randomUUID } from 'crypto';

describe('CatalogueService', () => {
  let service: CatalogueService;
  let repository: VideoRepository;

  const video1 = {
    title: 'Test Video 1',
    description: 'This is a test video 1',
    videoUrl: 'https://example.com/videos/test1.mp4',
    thumbnailUrl: 'https://example.com/thumbnails/test1.jpg',
    sizeInKb: 1024,
    duration: 60,
  };

  const video2 = {
    title: 'Test Video 2',
    description: 'This is a test video 2',
    videoUrl: 'https://example.com/videos/test2.mp4',
    thumbnailUrl: 'https://example.com/thumbnails/test2.jpg',
    sizeInKb: 2048,
    duration: 120,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ContentStreamingModule],
    }).compile();

    service = module.get<CatalogueService>(CatalogueService);

    repository = module.get<VideoRepository>(VideoRepository);
  });

  describe('listAllVideos', () => {
    it('returns an array of videos', async () => {
      jest.spyOn(repository, 'findAll').mockResolvedValueOnce([
        new VideoEntity({
          ...{
            id: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...video1,
        }),
        new VideoEntity({
          ...{
            id: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...video2,
        }),
      ]);
      const result = await service.listVideos();

      //using object containing to not have to deal with ids and createdAt updateAt fields
      expect(result).toEqual([
        expect.objectContaining(video1),
        expect.objectContaining(video2),
      ]);
    });
  });

  describe('getVideoInfo', () => {
    it('returns a video entity', async () => {
      const videoId = 'ed28ab23-122d-47b9-bb85-bde567bc0e45';
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(
        new VideoEntity({
          ...{
            id: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...video1,
        })
      );
      const result = await service.getVideoInfo(videoId);
      expect(result).toEqual(expect.objectContaining(video1));
    });

    it('returns null if video entity is not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      const result = await service.getVideoInfo('invalid-id');

      expect(result).toBeNull();
    });
  });
});
