import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';
import { MediaPlayerService } from '@src/module/content/core/service/media-player.service';
import { ContentMediaRepository } from '@src/module/content/persistence/repository/content-media.repository';

describe('MediaPlayerService', () => {
  let mediaPlayerService: MediaPlayerService;
  let contentMediaRepository: jest.Mocked<ContentMediaRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MediaPlayerService,
        {
          provide: ContentMediaRepository,
          useValue: {
            getVideoById: jest.fn(),
          },
        },
      ],
    }).compile();

    mediaPlayerService = moduleRef.get<MediaPlayerService>(MediaPlayerService);
    contentMediaRepository = moduleRef.get(ContentMediaRepository);
  });

  it('returns video url if video exists', async () => {
    const videoId = '123';
    const videoUrl = 'http://example.com/video.mp4';
    contentMediaRepository.getVideoById.mockResolvedValue({
      metadata: {
        url: videoUrl,
      },
    } as any);

    const result = await mediaPlayerService.prepareStreaming(videoId);

    expect(result).toBe(videoUrl);
    expect(contentMediaRepository.getVideoById).toHaveBeenCalledWith(videoId);
  });

  it('throws VideoNotFoundException if video does not exist', async () => {
    const videoId = faker.string.uuid();
    contentMediaRepository.getVideoById.mockResolvedValue(undefined);

    await expect(mediaPlayerService.prepareStreaming(videoId)).rejects.toThrow(
      `video with id ${videoId} not found`
    );
    expect(contentMediaRepository.getVideoById).toHaveBeenCalledWith(videoId);
  });
});
