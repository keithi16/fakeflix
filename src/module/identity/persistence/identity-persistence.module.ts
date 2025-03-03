import { DynamicModule } from '@nestjs/common';
import { User } from '@src/module/identity/persistence/entity/user.entity';
import { UserRepository } from '@src/module/identity/persistence/repository/user.repository';
import { TypeOrmPersistenceModule } from '@src/shared/module/persistence/typeorm/typeorm-persistence.module';

export class IdentityPersistenceModule {
  static forRoot(opts?: { migrations?: string[] }): DynamicModule {
    const { migrations } = opts || {};
    return {
      module: IdentityPersistenceModule,
      imports: [
        TypeOrmPersistenceModule.forRoot({
          connectionName: 'identity',
          migrations,
          entities: [User],
        }),
      ],
      providers: [UserRepository],
      exports: [UserRepository],
    };
  }
}
