import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { Charge } from '../entity/charge.entity';

@Injectable()
export class ChargeRepository extends DefaultTypeOrmRepository<Charge> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(Charge, dataSource.manager);
  }

  async findById(id: string): Promise<Charge | null> {
    return this.findOne({
      where: { id },
      relations: ['subscription', 'invoice'],
    });
  }

  async findByUserId(userId: string): Promise<Charge[]> {
    return this.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Charge[]> {
    return this.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByInvoiceId(invoiceId: string): Promise<Charge[]> {
    return this.find({
      where: { invoiceId },
      order: { createdAt: 'ASC' },
    });
  }
}

