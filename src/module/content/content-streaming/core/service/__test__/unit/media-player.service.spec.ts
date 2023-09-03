import { Test, TestingModule } from '@nestjs/testing';
import { MediaPlayerService } from '@src/module/content/content-streaming/core/service/media-player.service';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { VideoRepository } from '@src/module/content/shared/storage/repository/video.repository';
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
      const video = VideoEntity.create({
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 1430145,
        duration: 100,
      });

      jest.spyOn(videoRepository, 'findOne').mockResolvedValueOnce(video);

      const result = await service.prepareStreaming('1');

      expect(result).toEqual('uploads/test.mp4');
      expect(videoRepository.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw an error if the video does not exist', async () => {
      const id = randomUUID();
      jest.spyOn(videoRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.prepareStreaming(id)).rejects.toThrowError('Video not found');
      expect(videoRepository.findOne).toHaveBeenCalledWith(id);
    });
  });
});
