import { Test, TestingModule } from '@nestjs/testing';
import { ContentType } from '@src/module/content/content-management/core/enum/content-type.enum';
import { ContentManagementService } from '@src/module/content/content-management/core/service/content-management.service';
import { Content } from '@src/module/content/content-management/persistence/model/content.model';
import { ContentRepository } from '@src/module/content/content-management/persistence/repository/content.repository';
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
      .mockResolvedValue(undefined as any);

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
