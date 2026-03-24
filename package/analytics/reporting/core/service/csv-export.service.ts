import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Readable } from 'stream';
import { AggregationFacade } from '../../../aggregation/public-api/facade/aggregation.facade';
import { ExportQueryDto } from '../../http/rest/dto/export-query.dto';

function objectToCsvRow(obj: Record<string, unknown>): string {
  return (
    Object.values(obj)
      .map((v) => {
        const val = v === null || v === undefined ? '' : String(v);
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',') + '\n'
  );
}

function headerRow(keys: string[]): string {
  return keys.map((k) => `"${k}"`).join(',') + '\n';
}

@Injectable()
export class CsvExportService {
  constructor(private readonly aggregationFacade: AggregationFacade) {}

  async exportContentPerformance(_query: ExportQueryDto, response: Response): Promise<void> {
    const [rows] = await this.aggregationFacade.getContentPerformancePaginated({
      page: 1,
      limit: 10000,
    });

    const columns = [
      'contentId',
      'contentType',
      'totalViews',
      'uniqueViewers',
      'totalWatchTimeMs',
      'avgCompletionPercentage',
      'completionCount',
      'lastComputedAt',
    ];

    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', 'attachment; filename="content-performance.csv"');

    const readable = Readable.from(
      (async function* () {
        yield headerRow(columns);
        for (const row of rows) {
          yield objectToCsvRow(row as unknown as Record<string, unknown>);
        }
      })(),
    );

    readable.pipe(response);
    await new Promise<void>((resolve, reject) => {
      readable.on('end', resolve);
      readable.on('error', reject);
    });
  }

  async exportUserEngagement(_query: ExportQueryDto, response: Response): Promise<void> {
    const columns = [
      'userId',
      'contentId',
      'contentType',
      'totalWatchTimeMs',
      'completionPercentage',
      'completed',
      'watchCount',
      'lastWatchedAt',
    ];

    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', 'attachment; filename="user-engagement.csv"');

    response.write(headerRow(columns));
    response.end();
  }
}
