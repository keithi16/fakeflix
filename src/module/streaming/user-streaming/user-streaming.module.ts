import { Module } from '@nestjs/common';
import { SharedStreamingModule } from '@src/module/streaming/shared/streaming-shared.module';
import { VideoCatalogueService } from './core/service/video-catalogue.service';

@Module({
  imports: [SharedStreamingModule],
  providers: [VideoCatalogueService],
  controllers: [],
})
export class UserStreamingModule {}
