import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { createNestApp, Tables } from '@tlc/shared-lib/test';
import { ConfigModule, ConfigService } from '@tlc/shared-module/config';
import knex, { Knex } from 'knex';
import nock from 'nock';
import request from 'supertest';
import { IdentityConfig, identityConfigFactory } from '../../../config';
import { UserManagementService } from '../../../user/core/service/user-management.service';
import { IdentityModule } from '../../../identity.module';

describe('AuthResolver (e2e)', () => {
  let app: INestApplication;
  let userManagementService: UserManagementService;
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
    userManagementService = module.get<UserManagementService>(UserManagementService);
    const configService = module.get<ConfigService<IdentityConfig>>(ConfigService);
    testDbClient = knex({
      client: 'pg',
      connection: `${configService.get('identity.database.url')}`,
      searchPath: ['public'],
    });
  });

  beforeEach(async () => {
    nock.cleanAll();
    await testDbClient(Tables.User).del();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(async () => {
    nock.cleanAll();
    await testDbClient(Tables.User).del();
    await module.close();
  });

  describe('signIn mutation', () => {
    it('returns accessToken for valid credentials', async () => {
      const timestamp = Date.now();
      const signInInput = {
        email: `johndoe${timestamp}@example.com`,
        password: 'password123',
      };
      const createdUser = await userManagementService.create({
        firstName: 'John',
        lastName: 'Doe',
        email: signInInput.email,
        password: signInInput.password,
      });
      nock('https://localhost:3000', {
        encodedQueryParams: true,
        reqheaders: {
          Authorization: (): boolean => true,
        },
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`/subscription/user/${createdUser.id}/active`)
        .reply(200, {
          isActive: true,
        });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        })
        .expect(200);

      if (response.body.errors) {
        console.error('GraphQL Errors:', JSON.stringify(response.body.errors, null, 2));
      }

      expect(response.body.data).toBeDefined();
      expect(response.body.data.signIn).toBeDefined();
      expect(response.body.data.signIn.accessToken).toBeDefined();
    });
    it('returns unauthorized if the user does not exist', async () => {
      const timestamp = Date.now();
      const signInInput = {
        email: `nonexistent${timestamp}@example.com`,
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        })
        .expect(200);
      expect(response.body.errors[0].message).toContain(
        'Cannot authorize user'
      );
    });
    it('returns unauthorized if the subscription is not active', async () => {
      const timestamp = Date.now();
      const signInInput = {
        email: `inactive${timestamp}@example.com`,
        password: 'password123',
      };

      const createdUser = await userManagementService.create({
        firstName: 'John',
        lastName: 'Doe',
        email: signInInput.email,
        password: signInInput.password,
      });
      nock('https://localhost:3000', {
        encodedQueryParams: true,
        reqheaders: {
          Authorization: (): boolean => true,
        },
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`/subscription/user/${createdUser.id}/active`)
        .reply(200, {
          isActive: false,
        });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        })
        .expect(200);
      expect(response.body.errors[0].message).toContain(
        'Cannot authorize user User subscription is not active'
      );
    });
  });
  describe('getProfile query', () => {
    //Used in examples about module to module calls, its skiped because the default is to use local calls
    it('returns the authenticated user - USING HTTP for module to module calls', async () => {
      const timestamp = Date.now();
      const signInInput = {
        email: `profile${timestamp}@example.com`,
        password: 'password123',
      };
      const createdUser = await userManagementService.create({
        firstName: 'John',
        lastName: 'Doe',
        email: signInInput.email,
        password: signInInput.password,
      });
      nock('https://localhost:3000', {
        encodedQueryParams: true,
        reqheaders: {
          Authorization: (): boolean => true,
        },
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`/subscription/user/${createdUser.id}/active`)
        .reply(200, {
          isActive: true,
        });

      const acessTokenResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        });
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${acessTokenResponse.body.data.signIn.accessToken}`)
        .send({
          query: `
            query {
              getProfile {
                email
              }
            }
          `,
        });

      const { email } = response.body.data.getProfile;

      expect(email).toEqual(signInInput.email);
    });
    it('returns unauthorized for invalid tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer fake-token`)
        .send({
          query: `
            query {
              getProfile {
                email
              }
            }
          `,
        });

      expect(response.body.errors[0].message).toEqual('Unauthorized');
    });
  });
});
