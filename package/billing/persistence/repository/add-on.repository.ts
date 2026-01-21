import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@tlc/shared-module/typeorm';
import { DataSource } from 'typeorm';
import { AddOn } from '../entity/add-on.entity';

@Injectable()
export class AddOnRepository extends DefaultTypeOrmRepository<AddOn> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource
  ) {
    super(AddOn, dataSource.manager);
  }

  async findById(id: string): Promise<AddOn | null> {
    return this.findOne({
      where: { id },
    });
  }

  async findActiveAddOns(): Promise<AddOn[]> {
    return this.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findByIds(ids: string[]): Promise<AddOn[]> {
    return this.findByIds(ids);
  }
}

