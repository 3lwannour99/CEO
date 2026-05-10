import path from 'node:path';
import type { JwtSignOptions } from '@nestjs/jwt';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.join(process.cwd(), '.env'), quiet: true });
loadEnv({ path: path.join(process.cwd(), '..', '.env'), quiet: true });

export function getJwtSecret() {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) {
        throw new Error('JWT_SECRET is required for authentication.');
    }

    return secret;
}

export function getJwtExpiresIn() {
    return (process.env.JWT_EXPIRES_IN?.trim() ||
        '1d') as JwtSignOptions['expiresIn'];
}
