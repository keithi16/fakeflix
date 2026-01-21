import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm';
import { IdentityConfig } from '../config';
import { UserRepository } from './repository/user.repository';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      name: 'identity',
      imports: [ConfigModule.forRoot()],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<IdentityConfig>) => {
        return dataSourceOptionsFactory(configService);
      },
    }),
  ],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class IdentityPersistenceModule {}
