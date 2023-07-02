import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { StreamingModule } from './module/streaming/streaming.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';

@Module({
  imports: [
    StreamingModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      driver: ApolloDriver,
    }),
  ],
  controllers: [],
  providers: [AppResolver],
})
export class AppModule {}
