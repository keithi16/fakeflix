import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { Tables } from '@tlc/shared-lib/test/enum/tables.enum';
import { createNestApp } from '@tlc/shared-lib/test/test-e2e.setup';
import { ConfigModule } from '@tlc/shared-module/config/config.module';
import { ConfigService } from '@tlc/shared-module/config/service/config.service';
import knex, { Knex } from 'knex';
import request from 'supertest';
import { IdentityConfig, identityConfigFactory } from '../../../config';
import { IdentityModule } from '../../../identity.module';

describe('UserResolver (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let testDbClient: Knex;

  beforeAll(async () => {
    const createdApp = await createNestApp([
      ConfigModule.forRoot({
        load: [identityConfigFactory],
      }),
      IdentityModule,
    ]);

    app = createdApp.app;
    module = createdApp.module;
    const configService = module.get<ConfigService<IdentityConfig>>(ConfigService);
    testDbClient = knex({
      client: 'pg',
      connection: `${configService.get('identity.database.url')}`,
      searchPath: ['public'],
    });
  });

  beforeEach(async () => {
    await testDbClient(Tables.User).del();
  });

  afterAll(async () => {
    await testDbClient(Tables.User).del();
    await module.close();
  });

  describe('Identity - createUser mutation', () => {
    it('creates a new user', async () => {
      const createUserInput = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              createUser(CreateUserInput: {
                firstName: "${createUserInput.firstName}",
                lastName: "${createUserInput.lastName}",
                email: "${createUserInput.email}",
                password: "${createUserInput.password}"
              }) {
                id
                firstName
                lastName
                email
              }
            }
          `,
        });
      const { id, firstName, lastName, email } = response.body.data.createUser;

      expect(id).toBeDefined();
      expect(firstName).toBe(createUserInput.firstName);
      expect(lastName).toBe(createUserInput.lastName);
      expect(email).toBe(createUserInput.email);
    });
    it('throws error for invalid email validation', async () => {
      const createUserInput = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalidemail',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              createUser(CreateUserInput: {
                firstName: "${createUserInput.firstName}",
                lastName: "${createUserInput.lastName}",
                email: "${createUserInput.email}",
                password: "${createUserInput.password}"
              }) {
                id
                firstName
                lastName
                email
              }
            }
          `,
        })
        .expect(200);
      expect(response.body.errors[0].message).toBe(`Bad Request Exception`);
      expect(response.body.errors[0].extensions.originalError.message[0]).toBe(
        `email must be an email`
      );
    });
  });
});
