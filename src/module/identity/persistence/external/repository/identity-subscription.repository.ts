import { Injectable } from '@nestjs/common';

@Injectable()
export class IdentitySubscriptionRepository {
  //   extends DefaultPrismaRepository
  //   implements BillingSubsriptionStatusApi
  // {
  //   private readonly model: PrismaService['subscription'];
  //   constructor(prismaService: PrismaService) {
  //     super();
  //     this.model = prismaService.subscription;
  //   }
  // async isUserSubscriptionActive(userId: string): Promise<boolean> {
  //   try {
  //     const subscription = await this.model.findFirst({
  //       where: {
  //         userId,
  //         status: SubscriptionStatus.ACTIVE,
  //       },
  //     });
  //     return !!subscription;
  //   } catch (error) {
  //     this.handleAndThrowError(error);
  //   }
  // }
}
