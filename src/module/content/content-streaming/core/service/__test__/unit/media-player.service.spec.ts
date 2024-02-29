import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';
import { MediaPlayerService } from '@src/module/content/content-streaming/core/service/media-player.service';
import { ContentRepository } from '@src/module/content/content-streaming/persistence/repository/content.repository';

describe('MediaPlayerService', () => {
  let mediaPlayerService: MediaPlayerService;
  let contentRepository: jest.Mocked<ContentRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MediaPlayerService,
        {
          provide: ContentRepository,
          useValue: {
            getVideoById: jest.fn(),
          },
        },
      ],
    }).compile();

    mediaPlayerService = moduleRef.get<MediaPlayerService>(MediaPlayerService);
    contentRepository = moduleRef.get(ContentRepository);
  });

  it('should return video url if video exists', async () => {
    const videoId = '123';
    const videoUrl = 'http://example.com/video.mp4';
    contentRepository.getVideoById.mockResolvedValue({
      metadata: {
        url: videoUrl,
      },
    } as any);

    const result = await mediaPlayerService.prepareStreaming(videoId);

    expect(result).toBe(videoUrl);
    expect(contentRepository.getVideoById).toHaveBeenCalledWith(videoId);
  });

  it('should throw VideoNotFoundException if video does not exist', async () => {
    const videoId = faker.string.uuid();
    contentRepository.getVideoById.mockResolvedValue(undefined);

    await expect(mediaPlayerService.prepareStreaming(videoId)).rejects.toThrow(
      `video with id ${videoId} not found`
    );
    expect(contentRepository.getVideoById).toHaveBeenCalledWith(videoId);
  });
});
