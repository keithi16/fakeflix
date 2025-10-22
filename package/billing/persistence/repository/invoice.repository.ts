import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { Invoice } from '../entity/invoice.entity';

@Injectable()
export class InvoiceRepository extends DefaultTypeOrmRepository<Invoice> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(Invoice, dataSource.manager);
  }

  async findById(id: string): Promise<Invoice | null> {
    return this.findOne({
      where: { id },
      relations: ['invoiceLines', 'charges', 'payments', 'subscription'],
    });
  }

  async findByUserId(userId: string): Promise<Invoice[]> {
    return this.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['invoiceLines', 'charges', 'payments'],
    });
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Invoice[]> {
    return this.find({
      where: { subscriptionId },
      order: { billingPeriodStart: 'DESC' },
      relations: ['invoiceLines', 'charges', 'payments'],
    });
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return this.findOne({
      where: { invoiceNumber },
      relations: ['invoiceLines', 'charges', 'payments'],
    });
  }
}

