import { Test, TestingModule } from '@nestjs/testing';
import { CatalogueService } from '@src/module/content/content-streaming/core/service/catalogue.service';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { ContentRepository } from '@src/module/content/shared/persistence/repository/content.repository';
import { VideoRepository } from '@src/module/content/shared/persistence/repository/video.repository';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';
import { randomUUID } from 'crypto';

describe('CatalogueService', () => {
  let service: CatalogueService;
  let repository: VideoRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogueService,
        ContentRepository,
        PrismaService,
        ConfigService,
        {
          provide: VideoRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CatalogueService>(CatalogueService);
    repository = module.get<VideoRepository>(VideoRepository);
  });

  describe('getVideoInfo', () => {
    it('should return the video with the specified ID', async () => {
      const id = randomUUID();
      const video = VideoEntity.createNew(
        {
          url: 'https://www.youtube.com/watch?v=video-id',
          duration: 100,
          sizeInKb: 1000,
        },
        id
      );

      (repository.findById as jest.Mock).mockResolvedValueOnce(video);

      const result = await service.getVideoInfo(id);

      expect(result).toEqual(video);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should return null if the video with the specified ID does not exist', async () => {
      const id = randomUUID();
      (repository.findById as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getVideoInfo(id);

      expect(result).toBeNull();
      expect(repository.findById).toHaveBeenCalledWith(id);
    });
  });
});
