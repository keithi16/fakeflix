import { BaseEntity } from '@src/shared/core/entity/base.entity';
import { Expose, instanceToPlain } from 'class-transformer';

export type NewVideoEntity = Omit<VideoEntityProps, 'id' | 'createdAt' | 'updatedAt'>;

export type VideoEntityProps = Pick<
  DefaultVideoEntity,
  | 'id'
  | 'title'
  | 'description'
  | 'videoUrl'
  | 'thumbnailUrl'
  | 'sizeInKb'
  | 'duration'
  | 'createdAt'
  | 'updatedAt'
>;

export abstract class DefaultVideoEntity extends BaseEntity {
  @Expose()
  title: string;
  @Expose()
  description: string;
  @Expose()
  videoUrl: string;
  @Expose()
  thumbnailUrl: string | null;
  @Expose()
  sizeInKb: number;
  @Expose()
  duration: number;

  constructor(data: VideoEntityProps) {
    super(data);
  }

  serialize(): VideoEntityProps {
    return instanceToPlain(this) as VideoEntityProps;
  }
}
