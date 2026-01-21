import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource, MoreThan } from 'typeorm';
import { Credit } from '../entity/credit.entity';

@Injectable()
export class CreditRepository extends DefaultTypeOrmRepository<Credit> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(Credit, dataSource.manager);
  }

  async findById(id: string): Promise<Credit | null> {
    return this.findOne({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Credit[]> {
    return this.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAvailableCreditsByUserId(userId: string): Promise<Credit[]> {
    return this.find({
      where: {
        userId,
        remainingAmount: MoreThan(0),
      },
      order: { expiresAt: 'ASC', createdAt: 'ASC' },
    });
  }
}

