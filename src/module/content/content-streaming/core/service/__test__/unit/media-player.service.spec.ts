import { faker } from '@faker-js/faker/locale/af_ZA';
import { Test, TestingModule } from '@nestjs/testing';
import { ContentStreamingModule } from '@src/module/content/content-streaming/content-streaming.module';
import { MediaPlayerService } from '@src/module/content/content-streaming/core/service/media-player.service';

describe('MediaPlayerService', () => {
  let service: MediaPlayerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ContentStreamingModule],
    }).compile();

    service = module.get<MediaPlayerService>(MediaPlayerService);
  });

  describe('prepareStreaming', () => {
    it('returns the video URL if the video exists', async () => {
      const fakeVideoId = faker.string.uuid();
      const result = await service.prepareStreaming(fakeVideoId);

      expect(result).toEqual(`http://video/${fakeVideoId}`);
    });
  });
});
