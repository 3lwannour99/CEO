import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma-client/client.js';
import { createPrismaAdapter } from './database-provider.js';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor() {
        super({ adapter: createPrismaAdapter() });
    }
}
