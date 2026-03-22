import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@tlc/shared-module/auth';
import { ClsService } from 'nestjs-cls';
import { EventIngestionService } from '../../../core/service/event-ingestion.service';
import { RecordHeartbeatBatchDto } from '../dto/record-heartbeat-batch.dto';
import { RecordPlayerEventDto } from '../dto/record-player-event.dto';

@Controller('analytics')
@UseGuards(AuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class PlayerEventController {
  constructor(
    private readonly eventIngestionService: EventIngestionService,
    private readonly cls: ClsService
  ) {}

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  async recordEvent(@Body() dto: RecordPlayerEventDto): Promise<{ received: boolean }> {
    const userId = this.cls.get('userId') as string;
    await this.eventIngestionService.recordEvent(userId, dto);
    return { received: true };
  }

  @Post('heartbeat')
  @HttpCode(HttpStatus.ACCEPTED)
  async recordHeartbeats(
    @Body() dto: RecordHeartbeatBatchDto
  ): Promise<{ received: boolean; count: number }> {
    const userId = this.cls.get('userId') as string;
    const { count } = await this.eventIngestionService.recordHeartbeats(userId, dto);
    return { received: true, count };
  }
}
