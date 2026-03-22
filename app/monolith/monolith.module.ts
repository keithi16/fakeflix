import { Module } from '@nestjs/common';
import { analyticsConfigFactory, AnalyticsModule } from '@tlc/analytics';
import { contentConfigFactory, ContentModule } from '@tlc/content';
import { identityConfigFactory, IdentityModule } from '@tlc/identity';
import { ConfigModule } from '@tlc/shared-module/config';
import { monolithApiConfigFactory } from './config';

@Module({
  imports: [
    ContentModule,
    IdentityModule,
    AnalyticsModule,
    ConfigModule.forRoot({
      load: [contentConfigFactory, monolithApiConfigFactory, identityConfigFactory, analyticsConfigFactory],
    }),
  ],
})
export class MonolithModule {}
