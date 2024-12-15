import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@src/app.module';
import { UserModel } from '@src/module/identity/core/model/user.model';
import { UserManagementService } from '@src/module/identity/core/service/user-management.service';
import { Tables } from '@testInfra/enum/tables.enum';
import { planFactory } from '@testInfra/factory/identity/plan.test-factory';
import { subscriptionFactory } from '@testInfra/factory/identity/subscription.test-factory';
import { testDbClient } from '@testInfra/knex.database';
import nock from 'nock';
import request from 'supertest';

describe('AuthResolver (e2e)', () => {
  let app: INestApplication;
  let userManagementService: UserManagementService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    userManagementService = module.get<UserManagementService>(UserManagementService);
  });

  beforeEach(async () => {
    await testDbClient(Tables.User).del();
    await testDbClient(Tables.Subscription).del();
    await testDbClient(Tables.Plan).del();
  });
  afterAll(async () => {
    await testDbClient(Tables.User).del();
    await testDbClient(Tables.Subscription).del();
    await testDbClient(Tables.Plan).del();
    await module.close();
  });

  describe('signIn mutation', () => {
    it('returns accessToken for valid credentials', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      };
      const createdUser = await userManagementService.create(
        UserModel.create({
          firstName: 'John',
          lastName: 'Doe',
          email: signInInput.email,
          password: signInInput.password,
        })
      );
      const plan = planFactory.build();
      const subscription = subscriptionFactory.build({
        planId: plan.id,
        status: 'ACTIVE' as any,
        userId: createdUser.id,
      });
      await testDbClient(Tables.Plan).insert(plan);
      await testDbClient(Tables.Subscription).insert(subscription);

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

      expect(response.body.data.signIn.accessToken).toBeDefined();
    });
    it('returns unauthorized if the user does not exist', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
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
      expect(response.body.errors[0].message).toEqual(
        'Cannot authorize user Cannot authorize user: johndoe@example.com'
      );
    });
    it('returns unauthorized if the subscription is not active', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      };

      await userManagementService.create(
        UserModel.create({
          firstName: 'John',
          lastName: 'Doe',
          email: signInInput.email,
          password: signInInput.password,
        })
      );

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
      expect(response.body.errors[0].message).toEqual(
        'Cannot authorize user User subscription is not active: johndoe@example.com'
      );
    });
  });
  describe('getProfile query', () => {
    it('returns the authenticated user', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      };
      const createdUser = await userManagementService.create(
        UserModel.create({
          firstName: 'John',
          lastName: 'Doe',
          email: signInInput.email,
          password: signInInput.password,
        })
      );
      const plan = planFactory.build();
      const subscription = subscriptionFactory.build({
        planId: plan.id,
        status: 'ACTIVE' as any,
        userId: createdUser.id,
      });
      await testDbClient(Tables.Plan).insert(plan);
      await testDbClient(Tables.Subscription).insert(subscription);
      nock('https://api.themoviedb.org/3', {
        encodedQueryParams: true,
        reqheaders: {
          Authorization: (): boolean => true,
        },
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`/search/keyword`)
        .query({
          query: 'Test Video',
          page: '1',
        })
        .reply(200, {
          results: [
            {
              id: '1',
            },
          ],
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
    //Used in examples about module to module calls, its skiped because the default is to use local calls
    it.skip('returns the authenticated user - USING HTTP for module to module calls', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      };
      const createdUser = await userManagementService.create(
        UserModel.create({
          firstName: 'John',
          lastName: 'Doe',
          email: signInInput.email,
          password: signInInput.password,
        })
      );
      nock('https://localhost:3000', {
        encodedQueryParams: true,
        reqheaders: {
          Authorization: (): boolean => true,
        },
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`/subscription/user/${createdUser.id}`)
        .reply(200, {
          status: 'ACTIVE',
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
