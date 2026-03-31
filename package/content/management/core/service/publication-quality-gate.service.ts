import { Injectable } from '@nestjs/common';
import { Content, isMovieContent, isTvShowContent } from '../../../shared/core';

export interface QualityGateFailure {
  field: string;
  rule: string;
  message: string;
}

export interface QualityGateResult {
  passed: boolean;
  failures: QualityGateFailure[];
}

@Injectable()
export class PublicationQualityGateService {
  validate(content: Content): QualityGateResult {
    const failures: QualityGateFailure[] = [];

    const thumbnail = isMovieContent(content)
      ? content.thumbnail
      : isTvShowContent(content)
        ? content.thumbnail
        : null;

    if (!thumbnail) {
      failures.push({
        field: 'thumbnail',
        rule: 'required',
        message: 'Content must have a thumbnail before publication',
      });
    }

    if (!content.description || content.description.length < 50) {
      failures.push({
        field: 'description',
        rule: 'minLength',
        message: 'Description must be at least 50 characters long',
      });
    }

    if (!content.genres || content.genres.length === 0) {
      failures.push({
        field: 'genres',
        rule: 'required',
        message: 'Content must have at least one genre assigned',
      });
    }

    if (content.ageRecommendation === null || content.ageRecommendation === undefined) {
      failures.push({
        field: 'ageRecommendation',
        rule: 'required',
        message: 'Content must have an age recommendation set',
      });
    }

    if (isTvShowContent(content)) {
      if (!content.episodes || content.episodes.length === 0) {
        failures.push({
          field: 'episodes',
          rule: 'required',
          message: 'TV show must have at least one episode before publication',
        });
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }
}
