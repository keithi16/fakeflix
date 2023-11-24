import { BaseEntity, BaseEntityProps } from '@src/shared/core/entity/base.entity';
import { randomUUID } from 'crypto';
import { VideoEntity } from './video.entity';

export interface MovieEntityProps extends BaseEntityProps {
  video: VideoEntity;
}

export class MovieEntity extends BaseEntity {
  private video: MovieEntityProps['video'];

  private constructor(data: MovieEntityProps) {
    super(data);
  }

  static createNew(
    data: Omit<MovieEntityProps, 'id' | 'createdAt' | 'updatedAt'>,
    id = randomUUID()
  ): MovieEntity {
    return new MovieEntity({
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static createFrom(data: MovieEntityProps): MovieEntity {
    return new MovieEntity({
      id: data.id,
      video: data.video,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  serialize() {
    return {
      id: this.id,
      video: this.video.serialize(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
  addVideo(video: VideoEntity): void {
    this.video = video;
  }

  getVideo(): VideoEntity {
    return this.video;
  }
}
