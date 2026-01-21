import { IsUUID, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsUUID(4)
  invoiceId: string;

  @IsString()
  paymentMethodId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}

