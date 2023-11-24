import { Test, TestingModule } from '@nestjs/testing';
import { ContentStreamingModule } from '@src/module/content/content-streaming/content-streaming.module';
import { MediaPlayerService } from '@src/module/content/content-streaming/core/service/media-player.service';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { VideoRepository } from '@src/module/content/shared/persistence/repository/video.repository';
import { randomUUID } from 'crypto';

describe('MediaPlayerService', () => {
  let service: MediaPlayerService;
  let videoRepository: VideoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ContentStreamingModule],
    }).compile();

    service = module.get<MediaPlayerService>(MediaPlayerService);
    videoRepository = module.get<VideoRepository>(VideoRepository);
  });

  describe('prepareStreaming', () => {
    it('returns the video URL if the video exists', async () => {
      const video = VideoEntity.createFrom({
        id: randomUUID(),
        url: 'uploads/test.mp4',
        sizeInKb: 1430145,
        duration: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(videoRepository, 'findById').mockResolvedValueOnce(video);

      const result = await service.prepareStreaming(video.getId());

      expect(result).toEqual('uploads/test.mp4');
    });

    it('throws an error if the video does not exist', async () => {
      const id = randomUUID();
      jest.spyOn(videoRepository, 'findById').mockResolvedValueOnce(null);

      await expect(service.prepareStreaming(id)).rejects.toThrowError('Video not found');
    });
  });
});
