import { NewVideo, Video } from '@src/module/streaming/domain/entity/video.entity';

export interface VideoRepository {
  findOne(id: string): Promise<Video | null>;
  create(video: NewVideo): Promise<Video>;
}

export const VideoRepository = Symbol('VideoRepository');
