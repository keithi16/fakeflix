import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource, IsNull, LessThanOrEqual, MoreThanOrEqual, Or } from 'typeorm';
import { TaxRate } from '../entity/tax-rate.entity';

@Injectable()
export class TaxRateRepository extends DefaultTypeOrmRepository<TaxRate> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(TaxRate, dataSource.manager);
  }

  async findById(id: string): Promise<TaxRate | null> {
    return this.findOne({
      where: { id },
    });
  }

  async findByRegionAndCategory(
    region: string,
    taxCategoryId: string,
    effectiveDate: Date = new Date()
  ): Promise<TaxRate | null> {
    return this.findOne({
      where: {
        region,
        taxCategoryId,
        isActive: true,
        effectiveFrom: LessThanOrEqual(effectiveDate),
        effectiveTo: Or(MoreThanOrEqual(effectiveDate), IsNull()),
      },
      order: { effectiveFrom: 'DESC' },
    });
  }

  async findActiveRates(): Promise<TaxRate[]> {
    return this.find({
      where: { isActive: true },
      order: { region: 'ASC' },
    });
  }
}

