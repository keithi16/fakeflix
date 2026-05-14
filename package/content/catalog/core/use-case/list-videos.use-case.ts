import { Injectable } from '@nestjs/common'
import { Video } from '../../../media/persistence/entity/video.entity'
import { VideoRepository } from '../../../media/persistence/repository/video.repository'

@Injectable()
export class ListVideosUseCase {
  constructor(private readonly videoRepository: VideoRepository) {}

  async execute(): Promise<Video[]> {
    return this.videoRepository.findAll()
  }
}
