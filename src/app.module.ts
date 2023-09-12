import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppResolver } from './app.resolver';
import { ContentModule } from './module/content/content.module';
import { IdentityModule } from './module/identity/identity.module';

@Module({
  imports: [
    ContentModule,
    IdentityModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      driver: ApolloDriver,
    }),
  ],
  providers: [AppResolver],
})
export class AppModule {}
