import { BadRequestException, Injectable } from '@nestjs/common';
import { Video } from '../../persistence/entity/video.entity';
import { VideoRepository } from '../../persistence/repository/video.repository';

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./, // link-local (AWS IMDS)
  /^::1$/,
];

function validateRemoteVideoUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new BadRequestException('Invalid video URL format');
  }

  if (parsed.protocol !== 'https:') {
    throw new BadRequestException('Only HTTPS URLs are allowed for remote video URLs');
  }

  const hostname = parsed.hostname;
  if (PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
    throw new BadRequestException('Remote video URL must not point to a private or loopback address');
  }
}

@Injectable()
export class MediaFacade {
  constructor(private readonly videoRepository: VideoRepository) {}

  async createVideo(url: string, sizeInKb: number): Promise<{ videoId: string }> {
    const isRemoteUrl = url.startsWith('http://') || url.startsWith('https://');
    if (isRemoteUrl) {
      validateRemoteVideoUrl(url);
    }
    const video = new Video({ url, sizeInKb });
    const saved = await this.videoRepository.save(video);
    return { videoId: saved.id };
  }

  async findVideoUrlById(videoId: string): Promise<string | null> {
    const video = await this.videoRepository.findOneById(videoId);
    return video?.url ?? null;
  }
}
