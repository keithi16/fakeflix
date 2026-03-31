import { ContentType } from '../../../../../shared/core/enum/content-type.enum';
import { PublishingStatus } from '../../../../../shared/core/enum/publishing-status.enum';
import { MovieContent, TvShowContent } from '../../../../../shared/core';
import { PublicationQualityGateService } from '../../publication-quality-gate.service';

const VALID_DESCRIPTION = 'A'.repeat(50);
const THUMBNAIL = { id: 'thumb-1', url: 'http://example.com/thumb.jpg' } as any;
const EPISODE = { id: 'ep-1', title: 'Pilot' } as any;

function makeMovie(overrides: Partial<MovieContent> = {}): MovieContent {
  return new MovieContent({
    type: ContentType.MOVIE,
    title: 'Test Movie',
    description: VALID_DESCRIPTION,
    genres: ['Action'],
    ageRecommendation: 13,
    publishingStatus: PublishingStatus.REVIEW,
    thumbnail: THUMBNAIL,
    ...overrides,
  } as Partial<MovieContent>);
}

function makeTvShow(overrides: Partial<TvShowContent> = {}): TvShowContent {
  return new TvShowContent({
    type: ContentType.TV_SHOW,
    title: 'Test Show',
    description: VALID_DESCRIPTION,
    genres: ['Drama'],
    ageRecommendation: 16,
    publishingStatus: PublishingStatus.REVIEW,
    thumbnail: THUMBNAIL,
    episodes: [EPISODE],
    ...overrides,
  } as Partial<TvShowContent>);
}

describe('PublicationQualityGateService', () => {
  let service: PublicationQualityGateService;

  beforeEach(() => {
    service = new PublicationQualityGateService();
  });

  describe('MOVIE — all gates pass', () => {
    it('returns passed: true when all quality criteria are met', () => {
      const result = service.validate(makeMovie());

      expect(result.passed).toBe(true);
      expect(result.failures).toHaveLength(0);
    });
  });

  describe('TV_SHOW — all gates pass', () => {
    it('returns passed: true when all quality criteria are met including at least one episode', () => {
      const result = service.validate(makeTvShow());

      expect(result.passed).toBe(true);
      expect(result.failures).toHaveLength(0);
    });
  });

  describe('thumbnail gate', () => {
    it('fails when thumbnail is null', () => {
      const result = service.validate(makeMovie({ thumbnail: null }));

      expect(result.passed).toBe(false);
      expect(result.failures).toContainEqual(
        expect.objectContaining({ field: 'thumbnail', rule: 'required' }),
      );
    });
  });

  describe('description gate', () => {
    it('fails when description is shorter than 50 characters', () => {
      const result = service.validate(makeMovie({ description: 'Too short' }));

      expect(result.passed).toBe(false);
      expect(result.failures).toContainEqual(
        expect.objectContaining({ field: 'description', rule: 'minLength' }),
      );
    });

    it('fails when description is an empty string', () => {
      const result = service.validate(makeMovie({ description: '' }));

      expect(result.passed).toBe(false);
      expect(result.failures).toContainEqual(
        expect.objectContaining({ field: 'description', rule: 'minLength' }),
      );
    });

    it('passes when description is exactly 50 characters', () => {
      const result = service.validate(makeMovie({ description: 'A'.repeat(50) }));

      expect(result.failures.some((f) => f.field === 'description')).toBe(false);
    });
  });

  describe('genres gate', () => {
    it('fails when genres array is empty', () => {
      const result = service.validate(makeMovie({ genres: [] }));

      expect(result.passed).toBe(false);
      expect(result.failures).toContainEqual(
        expect.objectContaining({ field: 'genres', rule: 'required' }),
      );
    });
  });

  describe('ageRecommendation gate', () => {
    it('fails when ageRecommendation is null', () => {
      const result = service.validate(makeMovie({ ageRecommendation: null }));

      expect(result.passed).toBe(false);
      expect(result.failures).toContainEqual(
        expect.objectContaining({ field: 'ageRecommendation', rule: 'required' }),
      );
    });
  });

  describe('TV_SHOW episodes gate', () => {
    it('fails when episodes array is empty', () => {
      const result = service.validate(makeTvShow({ episodes: [] }));

      expect(result.passed).toBe(false);
      expect(result.failures).toContainEqual(
        expect.objectContaining({ field: 'episodes', rule: 'required' }),
      );
    });

    it('passes for MOVIE even when no episodes are provided (gate does not apply)', () => {
      const result = service.validate(makeMovie());

      expect(result.failures.some((f) => f.field === 'episodes')).toBe(false);
    });
  });

  describe('multiple failures', () => {
    it('returns all failures when multiple gates fail simultaneously', () => {
      const result = service.validate(
        makeMovie({
          thumbnail: null,
          description: 'Short',
          genres: [],
          ageRecommendation: null,
        }),
      );

      expect(result.passed).toBe(false);
      expect(result.failures).toHaveLength(4);
      expect(result.failures.map((f) => f.field)).toEqual(
        expect.arrayContaining(['thumbnail', 'description', 'genres', 'ageRecommendation']),
      );
    });
  });
});
