import { IsEnum, IsISO8601, IsOptional } from 'class-validator';

export enum Granularity {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class UserEngagementQueryDto {
  @IsISO8601()
  @IsOptional()
  from?: string;

  @IsISO8601()
  @IsOptional()
  to?: string;

  @IsEnum(Granularity)
  @IsOptional()
  granularity?: Granularity = Granularity.DAILY;
}
