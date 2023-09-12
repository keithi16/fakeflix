import {
  DefaultVideoEntity,
  NewVideoEntity,
} from '@src/module/content/shared/core/entity/default-video.entity';
import { randomUUID } from 'crypto';

export class VideoEntity extends DefaultVideoEntity {
  static create(data: NewVideoEntity, id = randomUUID()): VideoEntity {
    return new VideoEntity({
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static getMaxFileSize(): number {
    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 gigabyte
    return MAX_FILE_SIZE;
  }

  static getMaxThumbnailSize(): number {
    const MAX_THUMBNAIL_SIZE = 1024 * 1024 * 10; // 10 megabytes
    return MAX_THUMBNAIL_SIZE;
  }
}
