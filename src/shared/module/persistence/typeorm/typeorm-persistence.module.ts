import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { ConfigService } from '@src/shared/module/config/config.service';
import { DefaultEntity } from './entity/default.entity';

@Module({})
export class TypeOrmPersistenceModule {
  static forRoot(options: {
    connectionName?: string;
    migrations?: string[];
    entities?: Array<typeof DefaultEntity>;
  }): DynamicModule {
    return {
      module: TypeOrmPersistenceModule,
      imports: [
        TypeOrmModule.forRootAsync({
          name: options.connectionName,
          imports: [ConfigModule.forRoot()],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => {
            return {
              name: options.connectionName,
              type: 'postgres',
              logging: false,
              autoLoadEntities: false,
              synchronize: false,
              migrationsTableName: 'typeorm_migrations',
              ...configService.get('database'),
              ...options,
            };
          },
        }),
      ],
    };
  }
}
