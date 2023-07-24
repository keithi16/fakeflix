import { Test, TestingModule } from '@nestjs/testing';
import { VideoPrismaRepository } from '@src/module/streaming/storage/repository/video.prisma-repository';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { DatabaseModule } from '@src/shared/module/database/database.module';
import { PrismaService } from '@src/shared/module/database/prisma.service';

describe('VideoRepository', () => {
  let prisma: PrismaService;
  let repository: VideoPrismaRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), DatabaseModule],
      providers: [VideoPrismaRepository],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    repository = module.get<VideoPrismaRepository>(VideoPrismaRepository);
  });

  afterAll(async () => {
    await prisma.$transaction([prisma.video.deleteMany()]);
    await prisma.$disconnect();
  });

  it('returns a video when given a valid ID', async () => {
    const video = await repository.create({
      name: 'Test Video',
    });

    const result = await repository.findOne(video.id);

    expect(result).toEqual(video);
  });

  it('returns null when given an invalid ID', async () => {
    const invalidId = 'invalid-id';

    const result = await repository.findOne(invalidId);

    expect(result).toEqual(null);
  });
});
