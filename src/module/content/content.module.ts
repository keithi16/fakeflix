import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/shared/module/logger/logger.module';
import { ContentManagementModule } from './content-management/content-management.module';
import { ContentProcessingModule } from './content-processing/content-processing.module';
import { ContentStreamingModule } from './content-streaming/content-streaming.module';

@Module({
  imports: [
    ContentManagementModule,
    ContentStreamingModule,
    ContentProcessingModule,
    LoggerModule,
  ],
  providers: [],
  controllers: [],
})
export class ContentModule {}
