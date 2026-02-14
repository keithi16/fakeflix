import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { Between, DataSource, IsNull } from 'typeorm';
import { UsageType } from '../../core/enum/usage-type.enum';
import { UsageRecord } from '../entity/usage-record.entity';

@Injectable()
export class UsageRecordRepository extends DefaultTypeOrmRepository<UsageRecord> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(UsageRecord, dataSource.manager);
  }

  async findById(id: string): Promise<UsageRecord | null> {
    return this.findOne({
      where: { id },
      relations: ['subscription'],
    });
  }

  async findBySubscriptionId(subscriptionId: string): Promise<UsageRecord[]> {
    return this.find({
      where: { subscriptionId },
      order: { timestamp: 'DESC' },
    });
  }

  async findBySubscriptionIdAndPeriod(
    subscriptionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageRecord[]> {
    return this.find({
      where: {
        subscriptionId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });
  }

  async findUnbilledBySubscriptionId(subscriptionId: string): Promise<UsageRecord[]> {
    return this.find({
      where: {
        subscriptionId,
        billedInInvoiceId: IsNull(),
      },
      order: { timestamp: 'ASC' },
    });
  }

  async aggregateUsageByType(
    subscriptionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Map<UsageType, number>> {
    const records = await this.findBySubscriptionIdAndPeriod(
      subscriptionId,
      startDate,
      endDate
    );

    const aggregation = new Map<UsageType, number>();

    for (const record of records) {
      const currentTotal = aggregation.get(record.usageType) || 0;
      aggregation.set(
        record.usageType,
        currentTotal + record.quantity * record.multiplier
      );
    }

    return aggregation;
  }

  async findUnbilledBySubscriptionIdAndPeriod(
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UsageRecord[]> {
    return this.find({
      where: {
        subscriptionId,
        timestamp: Between(periodStart, periodEnd),
        billedInInvoiceId: IsNull(),
      },
      order: { timestamp: 'ASC' },
    });
  }

  async findBySubscriptionIdAndUsageTypeAndPeriod(
    subscriptionId: string,
    usageType: UsageType,
    startDate: Date,
    endDate: Date
  ): Promise<UsageRecord[]> {
    return this.find({
      where: {
        subscriptionId,
        usageType,
        timestamp: Between(startDate, endDate),
      },
    });
  }
}
