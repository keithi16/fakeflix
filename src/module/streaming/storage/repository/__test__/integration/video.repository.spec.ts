import { PrismaClient } from '@prisma/client';
import { VideoRepository } from './video.repository';

describe('VideoRepository', () => {
  let prisma: PrismaClient;
  let videoRepository: VideoRepository;

  beforeAll(() => {
    prisma = new PrismaClient();
    videoRepository = new VideoRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return a video when given a valid ID', async () => {
    // Arrange
    const video = await prisma.video.create({
      data: {
        name: 'Test Video',
        url: 'https://example.com/test.mp4',
      },
    });

    // Act
    const result = await videoRepository.findOne(video.id);

    // Assert
    expect(result).toEqual(video);
  });

  it('should return null when given an invalid ID', async () => {
    // Arrange
    const invalidId = 'invalid-id';

    // Act
    const result = await videoRepository.findOne(invalidId);

    // Assert
    expect(result).toBeNull();
  });
});
