import { Module } from '@nestjs/common';
import { ContentManagementModule } from './management/content-management.module';
import { ContentCatalogModule } from './catalog/content-catalog.module';
import { ContentMediaModule } from './media/content-media.module';

@Module({
  imports: [ContentManagementModule, ContentMediaModule, ContentCatalogModule],
  exports: [ContentManagementModule],
})
export class ContentModule {}
