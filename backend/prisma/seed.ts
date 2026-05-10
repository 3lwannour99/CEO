import bcrypt from 'bcrypt';
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma-client/client';
import { createPrismaAdapter } from '../src/prisma/database-provider';

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });

const permissions = [
    ['dashboard.view', 'View dashboard summaries.'],
    ['inventory.view', 'View inventory data and inventory reports.'],
    ['inventory.sync', 'Run inventory synchronization.'],
    ['inventory.export', 'Export inventory/reporting data.'],
    ['alerts.view', 'View inventory alerts.'],
    ['replenishment.view', 'View replenishment suggestions.'],
    ['stockCoverage.view', 'View stock coverage reports.'],
    ['salesPerformance.view', 'View sales performance reports.'],
    ['logistics.view', 'View logistics reports.'],
    ['multiLocation.view', 'View multi-location reports.'],
    ['stockRules.view', 'View stock rules.'],
    ['stockRules.manage', 'Create, update, and deactivate stock rules.'],
    ['snapshots.view', 'View and run inventory snapshots.'],
    ['users.view', 'View users and roles.'],
    ['users.manage', 'Create and manage users.'],
    ['settings.manage', 'Manage application settings.'],
] as const;

const roleDescriptions = {
    SUPER_ADMIN: 'Full system access.',
    ADMIN: 'Administrative access for operations and user management.',
    MANAGER: 'Operational dashboard, reporting, export, and sync access.',
    VIEWER: 'Read-only dashboard and report access.',
} as const;

const rolePermissions: Record<keyof typeof roleDescriptions, string[]> = {
    SUPER_ADMIN: permissions.map(([key]) => key),
    ADMIN: permissions.map(([key]) => key).filter(
        (key) => key !== 'settings.manage',
    ),
    MANAGER: [
        'dashboard.view',
        'inventory.view',
        'inventory.sync',
        'inventory.export',
        'alerts.view',
        'replenishment.view',
        'stockCoverage.view',
        'salesPerformance.view',
        'logistics.view',
        'multiLocation.view',
        'stockRules.view',
        'snapshots.view',
    ],
    VIEWER: [
        'dashboard.view',
        'inventory.view',
        'alerts.view',
        'replenishment.view',
        'stockCoverage.view',
        'salesPerformance.view',
        'logistics.view',
        'multiLocation.view',
        'stockRules.view',
        'snapshots.view',
    ],
};

async function main() {
    const permissionRows = new Map<string, { id: string }>();

    for (const [key, description] of permissions) {
        const permission = await prisma.permission.upsert({
            create: { description, key },
            update: { description },
            where: { key },
        });
        permissionRows.set(key, permission);
    }

    for (const [name, description] of Object.entries(roleDescriptions)) {
        const role = await prisma.role.upsert({
            create: { description, name },
            update: { description },
            where: { name },
        });

        for (const permissionKey of rolePermissions[
            name as keyof typeof rolePermissions
        ]) {
            const permission = permissionRows.get(permissionKey);
            if (!permission) {
                continue;
            }

            await prisma.rolePermission.upsert({
                create: {
                    permissionId: permission.id,
                    roleId: role.id,
                },
                update: {},
                where: {
                    roleId_permissionId: {
                        permissionId: permission.id,
                        roleId: role.id,
                    },
                },
            });
        }
    }

    await seedAdminUser();
}

async function seedAdminUser() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    const fullName = process.env.ADMIN_FULL_NAME?.trim() || 'System Admin';

    if (!email || !password) {
        console.warn(
            'ADMIN_EMAIL or ADMIN_PASSWORD is missing. Skipping initial admin user seed.',
        );
        return;
    }

    const superAdminRole = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
        throw new Error('SUPER_ADMIN role was not seeded.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
        create: {
            email,
            fullName,
            isActive: true,
            passwordHash,
        },
        update: {
            fullName,
            isActive: true,
        },
        where: { email },
    });

    await prisma.userRole.upsert({
        create: {
            roleId: superAdminRole.id,
            userId: user.id,
        },
        update: {},
        where: {
            userId_roleId: {
                roleId: superAdminRole.id,
                userId: user.id,
            },
        },
    });

    console.log(`Seeded admin user ${email}.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
