import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { Payment } from '../entity/payment.entity';
import { PaymentStatus } from '../../core/enum/payment-status.enum';

@Injectable()
export class PaymentRepository extends DefaultTypeOrmRepository<Payment> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(Payment, dataSource.manager);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.findOne({
      where: { id },
      relations: ['invoice'],
    });
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    return this.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return this.find({
      where: { invoiceId },
      order: { createdAt: 'ASC' },
    });
  }

  async findSuccessfulByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return this.find({
      where: {
        invoiceId,
        status: PaymentStatus.Succeeded,
      },
      order: { createdAt: 'ASC' },
    });
  }
}

