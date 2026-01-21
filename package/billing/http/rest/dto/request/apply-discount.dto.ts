import { IsString, IsUUID } from 'class-validator';

export class ApplyDiscountRequestDto {
  @IsUUID(4)
  subscriptionId: string;

  @IsString()
  discountCode: string;
}

