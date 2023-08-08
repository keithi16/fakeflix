import { Test, TestingModule } from '@nestjs/testing';
import {
  NewVideoEntity,
  VideoEntity,
} from '@src/module/streaming/core/entity/video.entity';
import { VideoRepository } from '@src/module/streaming/storage/repository/video.repository';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { DatabaseModule } from '@src/shared/module/database/database.module';
import { PrismaService } from '@src/shared/module/database/prisma.service';

describe('VideoRepository', () => {
  let prisma: PrismaService;
  let repository: VideoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), DatabaseModule],
      providers: [VideoRepository],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    repository = module.get<VideoRepository>(VideoRepository);
  });

  afterAll(async () => {
    await prisma.$transaction([prisma.video.deleteMany()]);
    await prisma.$disconnect();
  });

  it('returns a video when given a valid ID', async () => {
    const data: NewVideoEntity = {
      title: 'Test Video',
      description: 'This is a test video',
      videoUrl: 'uploads/test.mp4',
      thumbnailUrl: 'uploads/test.jpg',
      sizeInKb: 100,
      duration: 100,
    };
    const newVideo = VideoEntity.create(data);
    const video = await repository.save(newVideo);

    const result = await repository.findOne(video.id);

    expect(result).toEqual(video);
  });

  it('returns null when given an invalid ID', async () => {
    const invalidId = 'invalid-id';

    const result = await repository.findOne(invalidId);

    expect(result).toEqual(null);
  });
});
