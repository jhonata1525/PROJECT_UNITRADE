import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { ModuloApp } from './../src/app.modulo.js';

describe('ControladorApp (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      imports: [ModuloApp],
    }).compile();

    app = modulo.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('UniTrade API funcionando');
  });

  afterEach(async () => {
    await app.close();
  });
});
