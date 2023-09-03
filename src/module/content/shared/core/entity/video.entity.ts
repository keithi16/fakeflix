import { randomUUID } from 'crypto';

export type NewVideoEntity = Omit<VideoEntity, 'id' | 'createdAt' | 'updatedAt'>;

export class VideoEntity {
  readonly id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  sizeInKb: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: VideoEntity) {
    Object.assign(this, data);
  }

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
    const MAX_THUMBNAL_SIZE = 1024 * 1024 * 10; // 10 megabytes
    return MAX_THUMBNAL_SIZE;
  }
}
