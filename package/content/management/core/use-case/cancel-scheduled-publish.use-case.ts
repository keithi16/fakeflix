import { Injectable } from '@nestjs/common';
import { ScheduledPublishProducer } from '../../queue/producer/scheduled-publish.queue-producer';

@Injectable()
export class CancelScheduledPublishUseCase {
  constructor(private readonly scheduledPublishProducer: ScheduledPublishProducer) {}

  async execute(contentId: string): Promise<void> {
    await this.scheduledPublishProducer.cancelSchedule(contentId);
  }
}
