import { Module } from '@nestjs/common';
import { ContentModule } from '@tlc/content/content.module';
import { IdentityModule } from '@tlc/identity/identity.module';
import { ConfigModule } from '@tlc/shared-module/config/config.module';

@Module({
  imports: [ContentModule, IdentityModule, ConfigModule.forRoot()],
})
export class MonolithModule {}
