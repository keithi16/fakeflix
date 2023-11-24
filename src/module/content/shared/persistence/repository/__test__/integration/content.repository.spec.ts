import { Test, TestingModule } from '@nestjs/testing';
import {
  ContentEntity,
  ContentType,
} from '@src/module/content/shared/core/entity/content.entity';
import { MovieEntity } from '@src/module/content/shared/core/entity/movie.entity';
import { ThumbnailEntity } from '@src/module/content/shared/core/entity/thumbnail.entity';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { ContentRepository } from '@src/module/content/shared/persistence/repository/content.repository';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';
import { randomUUID } from 'crypto';

describe('ContentRepository', () => {
  let contentRepository: ContentRepository;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentRepository, PrismaService, ConfigService],
    }).compile();

    contentRepository = module.get<ContentRepository>(ContentRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    await prismaService.content.deleteMany();
  });

  afterAll(async () => {
    await prismaService.content.deleteMany();

    await prismaService.$disconnect();
  });

  describe('create', () => {
    it('creates a content entity', async () => {
      const content = ContentEntity.createNew({
        type: ContentType.MOVIE,
        title: 'Test Movie',
        description: 'A test movie',
        thumbnail: ThumbnailEntity.createNew({
          url: 'http://test.com/image.jpg',
        }),
        media: MovieEntity.createNew({
          video: VideoEntity.createNew({
            url: 'http://test.com/video.mp4',
            duration: 120,
            sizeInKb: 1024,
          }),
        }),
      });

      await contentRepository.save(content);

      const result = await prismaService.content.findUnique({
        where: { id: content.getId() },
        include: { Thumbnail: true, Movie: { include: { Video: true } } },
      });
      const contentEntity = contentRepository.mapToEntity(result);
      expect(contentEntity).toEqual(content);
    });
  });

  describe('findById', () => {
    it('returns a content entity by id', async () => {
      const content = ContentEntity.createNew({
        type: ContentType.MOVIE,
        title: 'Test Movie',
        description: 'A test movie',
        thumbnail: ThumbnailEntity.createNew({
          url: 'http://test.com/image.jpg',
        }),
        media: MovieEntity.createNew({
          video: VideoEntity.createNew({
            url: 'http://test.com/video.mp4',
            duration: 120,
            sizeInKb: 1024,
          }),
        }),
      });

      const media = content.getMedia();
      if (!media) {
        throw new Error('Media is not defined for the content');
      }

      await prismaService.content.create({
        data: {
          id: content.getId(),
          type: content.getType(),
          title: content.getTitle(),
          description: content.getDescription(),
          createdAt: content.getCreatedAt(),
          updatedAt: content.getUpdatedAt(),
          Thumbnail: {
            create: content.getThumbnail()?.serialize(),
          },
          Movie: {
            create: {
              id: media.getId(),
              createdAt: media.getCreatedAt(),
              updatedAt: media.getUpdatedAt(),
              Video: {
                create: media.getVideo().serialize(),
              },
            },
          },
        },
      });

      const result = await contentRepository.findById(content.getId());
      expect(content).toEqual(result);
    });

    it('should return null if content entity is not found', async () => {
      const result = await contentRepository.findById(randomUUID());

      expect(result).toBeUndefined();
    });
  });
  describe('clear', () => {
    it('deletes all content entities', async () => {
      await prismaService.content.create({
        data: {
          id: randomUUID(),
          type: ContentType.MOVIE,
          title: 'Test Movie',
          description: 'A test movie',
          createdAt: new Date(),
          updatedAt: new Date(),
          Thumbnail: {
            create: {
              id: randomUUID(),
              url: 'https://example.com/test.jpg',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          Movie: {
            create: {
              id: randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
              Video: {
                create: {
                  id: randomUUID(),
                  url: 'https://example.com/test.mp4',
                  duration: 120,
                  sizeInKb: 1024,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            },
          },
        },
      });

      await contentRepository.clear();

      const content = await prismaService.content.findMany();
      const movie = await prismaService.movie.findMany();
      const video = await prismaService.video.findMany();
      const thumbnail = await prismaService.thumbnail.findMany();

      expect(content).toHaveLength(0);
      expect(movie).toHaveLength(0);
      expect(video).toHaveLength(0);
      expect(thumbnail).toHaveLength(0);
    });
  });
});
