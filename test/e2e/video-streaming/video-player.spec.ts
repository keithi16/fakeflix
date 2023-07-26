import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@src/app.module';
import request from 'supertest';

describe('Video player - example', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /fix-me', async () => {
    const { status } = await request(app.getHttpServer()).get('/not-found');

    expect(status).toEqual(HttpStatus.NOT_FOUND);
  });
});
