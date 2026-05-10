import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaPg } from '@prisma/adapter-pg';

export type DatabaseProvider = 'postgresql' | 'mysql';

export function getDatabaseProvider(): DatabaseProvider {
    const provider = (
        process.env.DATABASE_PROVIDER?.trim() || 'postgresql'
    ).toLowerCase();

    if (provider === 'postgres' || provider === 'postgresql') {
        return 'postgresql';
    }

    if (provider === 'mysql') {
        return 'mysql';
    }

    throw new Error(
        `Unsupported DATABASE_PROVIDER "${process.env.DATABASE_PROVIDER}". Use "postgresql" or "mysql".`,
    );
}

export function getDatabaseUrl(provider = getDatabaseProvider()): string {
    const candidates =
        provider === 'mysql'
            ? [process.env.DATABASE_URL, process.env.MYSQL_DATABASE_URL]
            : [
                  process.env.DATABASE_URL,
                  process.env.POSTGRES_DATABASE_URL,
                  process.env.TEMPLATE_DB_URL,
              ];
    const url = candidates.find((candidate) =>
        candidate ? urlMatchesProvider(candidate, provider) : false,
    );

    if (!url) {
        throw new Error(
            `No valid ${provider} database URL configured. Set DATABASE_URL or the provider-specific URL.`,
        );
    }

    return url;
}

function urlMatchesProvider(url: string, provider: DatabaseProvider): boolean {
    return provider === 'mysql'
        ? url.startsWith('mysql://')
        : url.startsWith('postgresql://') || url.startsWith('postgres://');
}

export function createPrismaAdapter() {
    const provider = getDatabaseProvider();
    const url = getDatabaseUrl(provider);

    if (provider === 'mysql') {
        return new PrismaMariaDb(url);
    }

    return new PrismaPg({ connectionString: url });
}
