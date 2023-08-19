import { Module } from '@nestjs/common';
import { VideoRepository } from '@src/module/streaming/shared/storage/repository/video.repository';
import { DatabaseModule } from '@src/shared/module/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [VideoRepository],
  controllers: [],
  exports: [VideoRepository],
})
export class SharedStreamingModule {}
