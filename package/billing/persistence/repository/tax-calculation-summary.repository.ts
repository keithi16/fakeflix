import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { TaxCalculationSummary } from '../entity/tax-calculation-summary.entity';

@Injectable()
export class TaxCalculationSummaryRepository extends DefaultTypeOrmRepository<TaxCalculationSummary> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(TaxCalculationSummary, dataSource.manager);
  }

  async findById(id: string): Promise<TaxCalculationSummary | null> {
    return this.findOne({
      where: { id },
    });
  }

  async findByInvoiceLineId(invoiceLineId: string): Promise<TaxCalculationSummary[]> {
    return this.find({
      where: { invoiceLineId },
      order: { createdAt: 'ASC' },
    });
  }
}

