import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { TaxCalculationError } from '../entity/tax-calculation-error.entity';

@Injectable()
export class TaxCalculationErrorRepository extends DefaultTypeOrmRepository<TaxCalculationError> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(TaxCalculationError, dataSource.manager);
  }

  async findById(id: string): Promise<TaxCalculationError | null> {
    return this.findOne({
      where: { id },
    });
  }

  async findByInvoiceId(invoiceId: string): Promise<TaxCalculationError[]> {
    return this.find({
      where: { invoiceId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByInvoiceId(invoiceId: string): Promise<TaxCalculationError | null> {
    return this.findOne({
      where: { invoiceId },
      order: { createdAt: 'DESC' },
    });
  }
}

