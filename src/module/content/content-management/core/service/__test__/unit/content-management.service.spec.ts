import { Test, TestingModule } from '@nestjs/testing';
import {
  ContentManagementService,
  CreateVideoDto,
} from '@src/module/content/content-management/core/service/content-management.service';
import {
  ContentEntity,
  ContentType,
} from '@src/module/content/shared/core/entity/content.entity';
import { MovieEntity } from '@src/module/content/shared/core/entity/movie.entity';
import { ThumbnailEntity } from '@src/module/content/shared/core/entity/thumbnail.entity';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { ContentRepository } from '@src/module/content/shared/persistence/repository/content.repository';
import crypto from 'crypto';

//necessary in order to generate predictable UUIDs
crypto.randomUUID = jest.fn();

describe('ContentManagementService', () => {
  let service: ContentManagementService;

  beforeEach(async () => {
    //Necessary in order to match createdAt and updatedAt fields in the entities
    jest.useFakeTimers({ advanceTimers: true });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentManagementService,
        {
          provide: ContentRepository,
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContentManagementService>(ContentManagementService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMovie', () => {
    it('creates a movie with a video and a thumbnail', async () => {
      jest
        .spyOn(crypto, 'randomUUID')
        .mockReturnValue('b0ab2e10-5ceb-11ee-8c99-0242ac120002');
      const video = {
        title: 'Test movie',
        description: 'Test description',
        videoUrl: 'https://example.com/test.mp4',
        thumbnailUrl: 'https://example.com/test.jpg',
        duration: 60,
        sizeInKb: 1024,
      };
      const expectedContent = ContentEntity.createNew({
        title: video.title,
        description: video.description,
        type: ContentType.MOVIE,
        media: MovieEntity.createNew({
          video: VideoEntity.createNew({
            url: video.videoUrl,
            duration: video.duration,
            sizeInKb: video.sizeInKb,
          }),
        }),
      });
      expectedContent.addThumbnail(
        ThumbnailEntity.createNew({ url: video.thumbnailUrl })
      );

      const result = await service.createMovie(video);

      expect(result).toEqual(expectedContent);
    });

    it('creates a movie with a video and no thumbnail', async () => {
      jest
        .spyOn(crypto, 'randomUUID')
        .mockReturnValue('b0ab2e10-5ceb-11ee-8c99-0242ac120002');
      const video: CreateVideoDto = {
        title: 'Test movie',
        description: 'Test description',
        videoUrl: 'https://example.com/test.mp4',
        duration: 60,
        sizeInKb: 1024,
      };

      const expectedContent = ContentEntity.createNew({
        title: video.title,
        description: video.description,
        type: ContentType.MOVIE,
        media: MovieEntity.createNew({
          video: VideoEntity.createNew({
            url: video.videoUrl,
            duration: video.duration,
            sizeInKb: video.sizeInKb,
          }),
        }),
      });
      const result = await service.createMovie(video);

      expect(result).toEqual(expectedContent);
    });
  });
});
