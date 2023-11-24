import { Test, TestingModule } from '@nestjs/testing';
import { VideoEntity } from '@src/module/content/shared/core/entity/video.entity';
import { VideoRepository } from '@src/module/content/shared/persistence/repository/video.repository';
import { ConfigService } from '@src/shared/module/config/service/config.service';
import { PrismaService } from '@src/shared/module/persistence/prisma.service';

describe('VideoRepository', () => {
  let repository: VideoRepository;
  let prismaService: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [PrismaService, ConfigService, VideoRepository],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    repository = module.get<VideoRepository>(VideoRepository);
  });

  afterAll(() => {
    module.close();
  });

  beforeEach(async () => {
    await prismaService.video.deleteMany({});
  });

  describe('findAll', () => {
    it('returns an array of VideoEntity instances', async () => {
      const video = VideoEntity.createNew({
        url: 'https://www.youtube.com/watch?v=video-id',
        duration: 100,
        sizeInKb: 1000,
      });

      await prismaService.video.create({
        data: video.serialize(),
      });

      const videos = await repository.findAll();

      expect(videos[0]).toEqual(video);
    });
  });

  describe('findById', () => {
    it('returns a VideoEntity instance if the video exists', async () => {
      const video = VideoEntity.createNew({
        url: 'https://www.youtube.com/watch?v=video-id',
        duration: 100,
        sizeInKb: 1000,
      });

      const createdVideo = await prismaService.video.create({
        data: video.serialize(),
      });

      const foundVideo = await repository.findById(createdVideo.id);

      expect(foundVideo).toEqual(video);
    });

    it('returns null if the video does not exist', async () => {
      const video = await repository.findById('nonexistent-id');

      expect(video).toBeNull();
    });
  });
});
