import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DefaultEntity } from '@tlc/shared-module/typeorm';
import { Subscription } from './subscription.entity';
import { AddOn } from './add-on.entity';

@Entity({ name: 'BillingSubscriptionAddOn' })
export class SubscriptionAddOn extends DefaultEntity<SubscriptionAddOn> {
  @Column()
  subscriptionId: string;

  @Column()
  addOnId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ default: 1 })
  quantity: number;

  @ManyToOne(() => Subscription, (subscription) => subscription.addOns)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @ManyToOne(() => AddOn, (addOn) => addOn.subscriptionAddOns)
  @JoinColumn({ name: 'addOnId' })
  addOn: AddOn;
}

