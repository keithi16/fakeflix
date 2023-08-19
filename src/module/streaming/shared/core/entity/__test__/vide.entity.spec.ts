import {
  NewVideoEntity,
  VideoEntity,
} from '@src/module/streaming/shared/core/entity/video.entity';

describe('VideoEntity', () => {
  describe('create', () => {
    it('creates a new video entity with a random UUID', () => {
      const data: NewVideoEntity = {
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 100,
        duration: 100,
      };

      const video = VideoEntity.create(data);

      expect(video).toBeDefined();
      expect(video.id).toBeDefined();
      expect(typeof video.id).toBe('string');
      expect(video.id.length).toBeGreaterThan(0);
      expect(video.title).toBe(data.title);
      expect(video.description).toBe(data.description);
      expect(video.videoUrl).toBe(data.videoUrl);
      expect(video.thumbnailUrl).toBe(data.thumbnailUrl);
      expect(video.sizeInKb).toBe(data.sizeInKb);
      expect(video.duration).toBe(data.duration);
      expect(video.createdAt).toBeInstanceOf(Date);
      expect(video.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a new video entity with the specified ID', () => {
      const data: NewVideoEntity = {
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 100,
        duration: 100,
      };
      const id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const video = VideoEntity.create(data, id);

      expect(video).toBeDefined();
      expect(video.id).toBe(id);
      expect(video.title).toBe(data.title);
      expect(video.description).toBe(data.description);
      expect(video.videoUrl).toBe(data.videoUrl);
      expect(video.thumbnailUrl).toBe(data.thumbnailUrl);
      expect(video.sizeInKb).toBe(data.sizeInKb);
      expect(video.duration).toBe(data.duration);
      expect(video.createdAt).toBeInstanceOf(Date);
      expect(video.updatedAt).toBeInstanceOf(Date);
    });
  });
});
