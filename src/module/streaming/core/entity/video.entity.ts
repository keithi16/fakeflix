import * as uuid from 'uuid';
export type NewVideoEntity = Omit<VideoEntity, 'id' | 'createdAt' | 'updatedAt'>;

export class VideoEntity {
  readonly id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  size: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: VideoEntity) {
    Object.assign(this, data);
  }

  static create(data: NewVideoEntity): VideoEntity {
    const id = uuid.v4();
    return new VideoEntity({
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
