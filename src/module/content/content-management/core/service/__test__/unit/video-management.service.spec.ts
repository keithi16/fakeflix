import { Test, TestingModule } from '@nestjs/testing';
import { ContentManagementModule } from '@src/module/content/content-management/content-management.module';
import { VideoEntity } from '@src/module/content/content-management/core/entity/video.entity';
import { VideoManagementService } from '@src/module/content/content-management/core/service/video-managament.service';
import { VideoRepository } from '@src/module/content/content-management/persistence/repository/video.repository';
import { NewVideoEntity } from '@src/module/content/shared/core/entity/default-video.entity';

describe('VideoManagementService', () => {
  let service: VideoManagementService;
  let repository: VideoRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ContentManagementModule],
    }).compile();

    service = module.get<VideoManagementService>(VideoManagementService);
    repository = module.get<VideoRepository>(VideoRepository);
  });

  describe('createVideo', () => {
    it('saves a new video entity to the database and returns the saved entity', async () => {
      const data: NewVideoEntity = {
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 100,
        duration: 100,
      };
      const newVideo = VideoEntity.create(data);
      jest.spyOn(repository, 'save').mockResolvedValue(newVideo);
      const result = await service.create(newVideo);
      expect(result).toEqual(newVideo);
    });
  });
});
