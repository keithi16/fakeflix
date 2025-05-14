import { Module } from '@nestjs/common';
import { contentConfigFactory, ContentModule } from '@tlc/content';
import { identityConfigFactory, IdentityModule } from '@tlc/identity';
import { ConfigModule } from '@tlc/shared-module/config';
import { monolithApiConfigFactory } from './config';

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
