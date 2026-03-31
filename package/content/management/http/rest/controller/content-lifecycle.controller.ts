import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AdminGuard, AuthGuard } from '@tlc/shared-module/auth';
import { ClsService } from 'nestjs-cls';
import { CancelScheduledPublishUseCase } from '../../../core/use-case/cancel-scheduled-publish.use-case';
import { BulkTransitionContentUseCase } from '../../../core/use-case/bulk-transition-content.use-case';
import { GetAdminContentUseCase } from '../../../core/use-case/get-admin-content.use-case';
import { ListAdminContentUseCase } from '../../../core/use-case/list-admin-content.use-case';
import { ListContentTransitionsUseCase } from '../../../core/use-case/list-content-transitions.use-case';
import { TransitionContentUseCase } from '../../../core/use-case/transition-content.use-case';
import { PublishingStatus } from '../../../../shared/core/enum/publishing-status.enum';
import { BulkTransitionContentDto } from '../dto/request/bulk-transition-content.dto';
import { TransitionContentDto } from '../dto/request/transition-content.dto';
import { BulkTransitionResponseDto } from '../dto/response/bulk-transition-content.dto';
import { BulkTransitionResult } from '../../../core/use-case/bulk-transition-content.use-case';
import { ContentTransitionResponseDto } from '../dto/response/content-transition.dto';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/content')
export class ContentLifecycleController {
  constructor(
    private readonly transitionContentUseCase: TransitionContentUseCase,
    private readonly bulkTransitionContentUseCase: BulkTransitionContentUseCase,
    private readonly listAdminContentUseCase: ListAdminContentUseCase,
    private readonly getAdminContentUseCase: GetAdminContentUseCase,
    private readonly listContentTransitionsUseCase: ListContentTransitionsUseCase,
    private readonly cancelScheduledPublishUseCase: CancelScheduledPublishUseCase,
    private readonly clsService: ClsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listContent(@Query('status') statusParam?: string, @Query('scheduled') scheduled?: string) {
    const statuses = statusParam
      ? (statusParam.split(',').filter(s => Object.values(PublishingStatus).includes(s as PublishingStatus)) as PublishingStatus[])
      : undefined;
    const scheduledOnly = scheduled === 'true';
    const contents = await this.listAdminContentUseCase.execute(statuses, scheduledOnly);

    return contents.map(c => ({
      id: c.id,
      title: c.title,
      type: c.type,
      publishingStatus: c.publishingStatus,
      scheduledPublishAt: c.scheduledPublishAt ?? undefined,
      archivedAt: c.archivedAt ?? undefined,
      archivedBy: c.archivedBy ?? undefined,
    }));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getContent(@Param('id') id: string) {
    const content = await this.getAdminContentUseCase.execute(id);
    return {
      id: content.id,
      title: content.title,
      type: content.type,
      publishingStatus: content.publishingStatus,
      scheduledPublishAt: content.scheduledPublishAt ?? undefined,
      archivedAt: content.archivedAt ?? undefined,
      archivedBy: content.archivedBy ?? undefined,
    };
  }

  @Patch(':id/transition')
  @HttpCode(HttpStatus.OK)
  async transitionContent(@Param('id') id: string, @Body() dto: TransitionContentDto) {
    const triggeredBy = this.clsService.get<string | undefined>('userId');
    if (!triggeredBy) {
      throw new UnauthorizedException('User context missing');
    }
    const scheduledPublishAt = dto.scheduledPublishAt ? new Date(dto.scheduledPublishAt) : undefined;
    const content = await this.transitionContentUseCase.execute(
      id,
      dto.targetState,
      triggeredBy,
      dto.reason,
      scheduledPublishAt,
    );
    return {
      id: content.id,
      publishingStatus: content.publishingStatus,
      scheduledPublishAt: content.scheduledPublishAt ?? undefined,
    };
  }

  @Get(':id/transitions')
  @HttpCode(HttpStatus.OK)
  async getContentTransitions(@Param('id') id: string): Promise<ContentTransitionResponseDto[]> {
    const transitions = await this.listContentTransitionsUseCase.execute(id);
    return transitions.map(ContentTransitionResponseDto.from);
  }

  @Post('bulk-transition')
  @HttpCode(HttpStatus.OK)
  async bulkTransitionContent(@Body() dto: BulkTransitionContentDto): Promise<BulkTransitionResponseDto> {
    const triggeredBy = this.clsService.get<string | undefined>('userId');
    if (!triggeredBy) {
      throw new UnauthorizedException('User context missing');
    }
    const result: BulkTransitionResult = await this.bulkTransitionContentUseCase.execute(dto.contentIds, dto.targetState, triggeredBy);
    return result as BulkTransitionResponseDto;
  }

  @Delete(':id/schedule')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelSchedule(@Param('id') id: string) {
    await this.cancelScheduledPublishUseCase.execute(id);
  }
}
