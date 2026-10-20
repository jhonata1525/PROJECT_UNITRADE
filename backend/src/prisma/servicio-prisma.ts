import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class ServicioPrisma
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const cadenaConexion = process.env.DATABASE_URL;

    if (!cadenaConexion) {
      throw new Error('DATABASE_URL no está definida en el archivo .env');
    }

    const adaptador = new PrismaPg({ connectionString: cadenaConexion });
    super({ adapter: adaptador });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
