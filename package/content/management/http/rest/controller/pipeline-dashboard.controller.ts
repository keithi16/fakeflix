import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { AdminGuard, AuthGuard } from '@tlc/shared-module/auth';
import { ListRecentTransitionsUseCase } from '../../../core/use-case/list-recent-transitions.use-case';
import { PipelineSummaryUseCase } from '../../../core/use-case/pipeline-summary.use-case';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/content/pipeline')
export class PipelineDashboardController {
  constructor(
    private readonly pipelineSummaryUseCase: PipelineSummaryUseCase,
    private readonly listRecentTransitionsUseCase: ListRecentTransitionsUseCase,
  ) {}

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  async getSummary(@Query('breakdown') breakdown?: string) {
    const breakdownParam = breakdown === 'contentType' ? ('contentType' as const) : undefined;
    return this.pipelineSummaryUseCase.execute(breakdownParam);
  }

  @Get('recent-transitions')
  @HttpCode(HttpStatus.OK)
  async getRecentTransitions() {
    const transitions = await this.listRecentTransitionsUseCase.execute(50);
    return transitions.map(t => ({
      contentId: t.contentId,
      previousState: t.previousState,
      newState: t.newState,
      triggeredBy: t.triggeredBy,
      timestamp: t.transitionedAt,
    }));
  }
}
