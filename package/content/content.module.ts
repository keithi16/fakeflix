import { Module } from '@nestjs/common';
import { ContentAdminModule } from './admin/content-admin.module';
import { ContentCatalogModule } from './catalog/content-catalog.module';
import { ContentVideoProcessorModule } from './video-processor/content-video-processor.module';

@Module({
  imports: [ContentAdminModule, ContentVideoProcessorModule, ContentCatalogModule],
})
export class ContentModule {}
