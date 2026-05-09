import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma-client/client.js';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor() {
        const adapter = new PrismaPg({
            connectionString: process.env.TEMPLATE_DB_URL,
        });

        super({ adapter });
    }
}
