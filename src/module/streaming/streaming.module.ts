import { Module } from '@nestjs/common';
import { AdminStreamingModule } from './admin-streaming/admin-streaming.module';
import { UserStreamingModule } from './user-streaming/user-streaming.module';

@Module({
  imports: [AdminStreamingModule, UserStreamingModule],
  providers: [],
  controllers: [],
})
export class StreamingModule {}
