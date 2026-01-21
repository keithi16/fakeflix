import { JsonMetadata } from '../../core/interface/common.interface';
import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Column, Entity, OneToMany } from 'typeorm';
import { PlanInterval } from '../../core/enum/plan-interval.enum';
import { Subscription } from './subscription.entity';

export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

@Entity({ name: 'Plan' })
export class Plan extends DefaultEntity<Plan> {
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ type: 'enum', enum: PlanInterval })
  interval: PlanInterval;

  @Column({ type: 'int', nullable: true })
  trialPeriod: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  taxCategoryId: string | null;

  @Column({ type: 'json', nullable: true })
  allowedAddOns: string[] | null;

  @Column({ type: 'json', nullable: true })
  includedUsageQuotas: Record<string, number> | null;

  @Column({ type: 'json', nullable: true })
  features: string[] | null;

  @Column({ type: 'json', nullable: true })
  metadata: JsonMetadata | null;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];
}
