import { Content, MovieContent, TvShowContent } from '../../persistence/entity/content.entity';
import { Video } from '../../../media/persistence/entity/video.entity';
import { Thumbnail } from '../../persistence/entity/thumbnail.entity';
import type { Episode } from '../../../management/persistence/entity/episode.entity';

/**
 * Type guard for Movie Content
 * Validates that content is MovieContent type
 */
export function isMovieContent(
  content: Content | null | undefined
): content is MovieContent {
  return (
    content !== null &&
    content !== undefined &&
    content instanceof MovieContent
  );
}

/**
 * Type guard for TvShow Content
 * Validates that content is TvShowContent type
 */
export function isTvShowContent(
  content: Content | null | undefined
): content is TvShowContent {
  return (
    content !== null &&
    content !== undefined &&
    content instanceof TvShowContent
  );
}

/**
 * Type guard for Movie Content with Video loaded
 * Validates that video relation is properly loaded
 */
export function isMovieContentWithVideo(
  content: Content | null | undefined
): content is MovieContent & { video: Video } {
  return (
    isMovieContent(content) &&
    content.video !== null &&
    content.video !== undefined &&
    typeof content.video.url === 'string'
  );
}

/**
 * Type guard for Movie Content fully loaded
 * Validates that video and thumbnail relations are loaded
 */
export function isMovieContentFullyLoaded(
  content: Content | null | undefined
): content is MovieContent & {
  video: Video;
  thumbnail: Thumbnail | null;
} {
  return (
    isMovieContent(content) &&
    content.video !== null &&
    content.video !== undefined &&
    content.thumbnail !== undefined
  );
}

/**
 * Type guard for TvShow Content with Episodes loaded
 * Validates that episodes array is loaded
 */
export function isTvShowContentWithEpisodes(
  content: Content | null | undefined
): content is TvShowContent & { episodes: Episode[] } {
  return isTvShowContent(content) && Array.isArray(content.episodes);
}
