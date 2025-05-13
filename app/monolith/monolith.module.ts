import { Module } from '@nestjs/common';
import { monolithApiConfigFactory } from './config';
import { contentConfigFactory } from '@tlc/content/config';
import { ContentModule } from '@tlc/content/content.module';
import { identityConfigFactory } from '@tlc/identity/config';
import { IdentityModule } from '@tlc/identity/identity.module';
import { ConfigModule } from '@tlc/shared-module/config/config.module';

@Module({
  imports: [
    ContentModule,
    IdentityModule,
    ConfigModule.forRoot({
      load: [contentConfigFactory, monolithApiConfigFactory, identityConfigFactory],
    }),
  ],
})
export class MonolithModule {}
