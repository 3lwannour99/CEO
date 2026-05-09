import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma-client/client';
import { createPrismaAdapter } from '../src/prisma/database-provider';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });

async function test() {}

test()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
