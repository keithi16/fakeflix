import { Field, InputType } from '@nestjs/graphql';
import { MaxLength } from 'class-validator';

@InputType()
export class UploadVideoInput {
  @Field()
  @MaxLength(30)
  name: string;
}
