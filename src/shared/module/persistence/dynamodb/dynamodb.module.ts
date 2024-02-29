import { Module } from '@nestjs/common';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { DynamoDBService } from './service/dynamodb.service';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [DynamoDBService],
  exports: [DynamoDBService],
})
export class DynamoDBPersistenceModule {}
