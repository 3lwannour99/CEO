import bcrypt from 'bcrypt';
import 'dotenv/config';
import { permissionCatalog } from '../src/auth/permission-catalog';
import { PrismaClient } from '../src/generated/prisma-client/client';
import { createPrismaAdapter } from '../src/prisma/database-provider';

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });

const roleDescriptions = {
    SUPER_ADMIN: 'Full system access.',
    ADMIN: 'Administrative access for operations and user management.',
    MANAGER: 'Operational dashboard, reporting, export, and sync access.',
    VIEWER: 'Read-only dashboard and report access.',
} as const;

const allPermissionKeys = permissionCatalog.map((permission) => permission.key);
const pageAndReadOnlyKeys = allPermissionKeys.filter(
    (key) =>
        key.endsWith('.view') &&
        !key.startsWith('users.') &&
        !key.startsWith('roles.') &&
        !key.startsWith('permissions.') &&
        !key.startsWith('settings.manage') &&
        !key.includes('cost') &&
        !key.includes('profit') &&
        !key.includes('customerPhone'),
);
const adminKeys = allPermissionKeys.filter(
    (key) =>
        !key.includes('data.cost') &&
        !key.includes('data.profit') &&
        key !== 'roles.delete' &&
        key !== 'users.delete',
);
const managerKeys = allPermissionKeys.filter(
    (key) =>
        (key.endsWith('.view') ||
            key === 'actions.export.view' ||
            key === 'actions.export.execute' ||
            key === 'actions.refreshDashboard.execute') &&
        !key.startsWith('users.') &&
        !key.startsWith('roles.') &&
        !key.startsWith('permissions.') &&
        !key.startsWith('settings.') &&
        !key.includes('data.cost') &&
        !key.includes('data.profit') &&
        !key.includes('data.customerPhone'),
);

const rolePermissions: Record<keyof typeof roleDescriptions, string[]> = {
    SUPER_ADMIN: allPermissionKeys,
    ADMIN: adminKeys,
    MANAGER: managerKeys,
    VIEWER: pageAndReadOnlyKeys,
};

async function main() {
    const permissionRows = new Map<string, { id: string }>();

    for (const item of permissionCatalog) {
        const permission = await prisma.permission.upsert({
            create: item,
            update: {
                category: item.category,
                description: item.description,
                labelAr: item.labelAr,
                labelEn: item.labelEn,
            },
            where: { key: item.key },
        });
        permissionRows.set(item.key, permission);
    }

    for (const [name, description] of Object.entries(roleDescriptions)) {
        const role = await prisma.role.upsert({
            create: { description, isActive: true, name },
            update: { description, isActive: true },
            where: { name },
        });
        const rolePermissionKeys = rolePermissions[name as keyof typeof rolePermissions];
        const rolePermissionIds = rolePermissionKeys
            .map((permissionKey) => permissionRows.get(permissionKey)?.id)
            .filter((permissionId): permissionId is string => Boolean(permissionId));

        await prisma.rolePermission.deleteMany({
            where: {
                roleId: role.id,
                permissionId: {
                    notIn: rolePermissionIds,
                },
            },
        });

        for (const permissionKey of rolePermissionKeys) {
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
