import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateVideoInputDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  readonly description: string;
}
