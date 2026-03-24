import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, OneToOne } from 'typeorm';
import { VideoMetadata } from './video-metadata.entity';

const bigintTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | number | null): number | null => {
    if (value === null || value === undefined) return null;
    return typeof value === 'string' ? Number(value) : value;
  },
};

@Entity({ name: 'ContentVideo' })
export class Video extends DefaultEntity<Video> {
  @Column()
  url: string;

  @Column({ type: 'bigint', nullable: true, transformer: bigintTransformer })
  sizeInKb: number | null;

  @Column({ type: 'bigint', nullable: true, transformer: bigintTransformer })
  duration: number | null;

  @OneToOne(() => VideoMetadata, (m) => m.video, { cascade: true })
  metadata: VideoMetadata;
}
