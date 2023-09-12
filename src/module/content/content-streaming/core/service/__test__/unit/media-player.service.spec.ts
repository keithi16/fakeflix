import { Test, TestingModule } from '@nestjs/testing';
import { VideoEntity } from '@src/module/content/content-streaming/core/entity/video.entity';
import { MediaPlayerService } from '@src/module/content/content-streaming/core/service/media-player.service';
import { VideoRepository } from '@src/module/content/content-streaming/persistence/repository/video.repository';
import { randomUUID } from 'crypto';

describe('MediaPlayerService', () => {
  let service: MediaPlayerService;
  let videoRepository: VideoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaPlayerService,
        {
          provide: VideoRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MediaPlayerService>(MediaPlayerService);
    videoRepository = module.get<VideoRepository>(VideoRepository);
  });

  describe('prepareStreaming', () => {
    it('returns the video URL if the video exists', async () => {
      const video = new VideoEntity({
        id: randomUUID(),
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 1430145,
        duration: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(videoRepository, 'findOne').mockResolvedValueOnce(video);

      const result = await service.prepareStreaming('1');

      expect(result).toEqual('uploads/test.mp4');
    });

    it('should throw an error if the video does not exist', async () => {
      const id = randomUUID();
      jest.spyOn(videoRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.prepareStreaming(id)).rejects.toThrowError('Video not found');
    });
  });
});
