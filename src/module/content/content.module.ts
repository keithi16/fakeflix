import { Module } from '@nestjs/common';
import { ContentManagementModule } from './content-management/content-management.module';
import { ContentProcessingModule } from './content-processing/content-processing.module';
import { ContentStreamingModule } from './content-streaming/content-streaming.module';

@Module({
  imports: [ContentManagementModule, ContentStreamingModule, ContentProcessingModule],
  providers: [],
  controllers: [],
})
export class ContentModule {}
