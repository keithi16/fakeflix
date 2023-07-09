import { Module } from '@nestjs/common';
import { VideoResolver } from './http/graphql/video.resolver';

@Module({})
export class StreamingModule {
  providers: [VideoResolver];
}
