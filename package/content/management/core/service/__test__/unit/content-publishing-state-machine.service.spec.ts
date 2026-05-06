import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Content } from '../../../../../shared/core';
import { PublishingStatus } from '../../../../../shared/core/enum/publishing-status.enum';
import { ContentPublishingStateMachineService } from '../../content-publishing-state-machine.service';

const makeContent = (status: PublishingStatus): Content =>
  ({ publishingStatus: status }) as unknown as Content;

describe('ContentPublishingStateMachineService', () => {
  let service: ContentPublishingStateMachineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentPublishingStateMachineService],
    }).compile();

    service = module.get<ContentPublishingStateMachineService>(ContentPublishingStateMachineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transition - valid transitions', () => {
    it('transitions from DRAFT to REVIEW', () => {
      const content = makeContent(PublishingStatus.DRAFT);
      service.transition(content, PublishingStatus.REVIEW);
      expect(content.publishingStatus).toBe(PublishingStatus.REVIEW);
    });

    it('transitions from REVIEW to PUBLISHED', () => {
      const content = makeContent(PublishingStatus.REVIEW);
      service.transition(content, PublishingStatus.PUBLISHED);
      expect(content.publishingStatus).toBe(PublishingStatus.PUBLISHED);
    });

    it('transitions from REVIEW to DRAFT', () => {
      const content = makeContent(PublishingStatus.REVIEW);
      service.transition(content, PublishingStatus.DRAFT);
      expect(content.publishingStatus).toBe(PublishingStatus.DRAFT);
    });

    it('transitions from PUBLISHED to ARCHIVED', () => {
      const content = makeContent(PublishingStatus.PUBLISHED);
      service.transition(content, PublishingStatus.ARCHIVED);
      expect(content.publishingStatus).toBe(PublishingStatus.ARCHIVED);
    });

    it('transitions from ARCHIVED to PUBLISHED', () => {
      const content = makeContent(PublishingStatus.ARCHIVED);
      service.transition(content, PublishingStatus.PUBLISHED);
      expect(content.publishingStatus).toBe(PublishingStatus.PUBLISHED);
    });
  });

  describe('transition - invalid transitions throw UnprocessableEntityException', () => {
    const invalidCases: [PublishingStatus, PublishingStatus][] = [
      [PublishingStatus.DRAFT, PublishingStatus.PUBLISHED],
      [PublishingStatus.DRAFT, PublishingStatus.ARCHIVED],
      [PublishingStatus.REVIEW, PublishingStatus.ARCHIVED],
      [PublishingStatus.PUBLISHED, PublishingStatus.DRAFT],
      [PublishingStatus.PUBLISHED, PublishingStatus.REVIEW],
      [PublishingStatus.ARCHIVED, PublishingStatus.DRAFT],
      [PublishingStatus.ARCHIVED, PublishingStatus.REVIEW],
    ];

    it.each(invalidCases)('throws when transitioning from %s to %s', (from, to) => {
      const content = makeContent(from);
      expect(() => service.transition(content, to)).toThrow(UnprocessableEntityException);
    });

    it.each(invalidCases)('leaves publishingStatus unchanged on invalid transition from %s to %s', (from, to) => {
      const content = makeContent(from);
      try {
        service.transition(content, to);
      } catch {
        // expected
      }
      expect(content.publishingStatus).toBe(from);
    });
  });

  describe('getAllowedTransitions', () => {
    it('returns [REVIEW] for DRAFT', () => {
      expect(service.getAllowedTransitions(PublishingStatus.DRAFT)).toEqual([PublishingStatus.REVIEW]);
    });

    it('returns [PUBLISHED, DRAFT] for REVIEW', () => {
      expect(service.getAllowedTransitions(PublishingStatus.REVIEW)).toEqual([
        PublishingStatus.PUBLISHED,
        PublishingStatus.DRAFT,
      ]);
    });

    it('returns [ARCHIVED] for PUBLISHED', () => {
      expect(service.getAllowedTransitions(PublishingStatus.PUBLISHED)).toEqual([PublishingStatus.ARCHIVED]);
    });

    it('returns [PUBLISHED] for ARCHIVED', () => {
      expect(service.getAllowedTransitions(PublishingStatus.ARCHIVED)).toEqual([PublishingStatus.PUBLISHED]);
    });
  });
});
