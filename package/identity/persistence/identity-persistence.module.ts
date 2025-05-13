import { Module } from '@nestjs/common';
import { IdentityConfig } from '../config';
import { UserRepository } from './repository/user.repository';
import { dataSourceOptionsFactory } from './typeorm-datasource.factory';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import { TypeOrmPersistenceModule } from '@tlc/shared-module/typeorm/typeorm-persistence.module';

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
