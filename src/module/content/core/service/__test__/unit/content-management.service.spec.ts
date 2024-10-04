import { Test, TestingModule } from '@nestjs/testing';
import { ContentType } from '@src/module/content/core/enum/content-type.enum';
import { ContentManagementService } from '@src/module/content/core/service/content-management.service';
import { ExternalMovieRatingClient } from '@src/module/content/http/client/external-movie-rating/external-movie-rating.client';
import { Content } from '@src/module/content/persistence/entity/content.entity';
import { ContentRepository } from '@src/module/content/persistence/repository/content.repository';
import { EventEmitterService } from '@src/shared/module/event/service/event-emitter.service';
import { AppLogger } from '@src/shared/module/logger/service/app-logger.service';
import { Repository } from 'typeorm';

describe('ContentManagementService', () => {
  let service: ContentManagementService;
  let contentRepository: Repository<Content>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentManagementService,
        {
          provide: ContentRepository,
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: EventEmitterService,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: ExternalMovieRatingClient,
          useValue: {
            getRating: jest.fn(),
          },
        },
        {
          provide: AppLogger,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContentManagementService>(ContentManagementService);
    contentRepository = module.get<ContentRepository>(ContentRepository);
  });

  it('creates a movie', async () => {
    const video = {
      title: 'Test Movie',
      description: 'Test Description',
      videoUrl: 'http://test.com',
      duration: 120,
      sizeInKb: 5000,
    };

    const saveSpy = jest
      .spyOn(contentRepository, 'save')
      .mockImplementation(async (content) => content as any);

    await service.createMovie(video);

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: video.title,
        description: video.description,
        type: ContentType.MOVIE,
        movie: expect.objectContaining({
          video: expect.objectContaining({
            url: video.videoUrl,
            duration: video.duration,
            sizeInKb: video.sizeInKb,
          }),
        }),
      })
    );
  });
});
