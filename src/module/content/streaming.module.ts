import { Module } from '@nestjs/common';
import { ContentManagementModule } from './content-management/content-management.module';
import { ContentStreamingModule } from './content-streaming/content-streaming.module';

@Module({
  imports: [ContentManagementModule, ContentStreamingModule],
  providers: [],
  controllers: [],
})
export class StreamingModule {}
