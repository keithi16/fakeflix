export interface BillingSubsriptionStatusApi {
  isUserSubscriptionActive(userId: string): Promise<boolean>;
}

export const BillingSubsriptionStatusApi = Symbol('BillingSubsriptionStatusApi');
