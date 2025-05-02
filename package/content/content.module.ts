import { Module } from '@nestjs/common';
import { ContentAdminModule } from '@tlc/content/admin/content-admin.module';
import { ContentCatalogModule } from '@tlc/content/catalog/content-catalog.module';
import { ContentVideoProcessorModule } from '@tlc/content/video-processor/content-video-processor.module';

@Module({
  imports: [ContentAdminModule, ContentVideoProcessorModule, ContentCatalogModule],
})
export class ContentModule {}
