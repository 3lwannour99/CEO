import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import type { Prisma } from '../generated/prisma-client/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserActiveDto } from './dto/update-user-active.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        const users = await this.prisma.user.findMany({
            include: userInclude,
            orderBy: [{ fullName: 'asc' }, { email: 'asc' }],
        });

        return users.map(toUserResponse);
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            include: userInclude,
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found.');
        }

        return toUserResponse(user);
    }

    async create(dto: CreateUserDto) {
        await this.assertEmailAvailable(dto.email);

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: normalizeEmail(dto.email),
                fullName: dto.fullName,
                isActive: dto.isActive ?? true,
                passwordHash,
            },
        });

        await this.replaceRoles(user.id, {
            roleNames: dto.roleNames ?? ['VIEWER'],
        });
        return this.findOne(user.id);
    }

    async update(id: string, dto: UpdateUserDto) {
        await this.findOne(id);

        if (dto.email) {
            await this.assertEmailAvailable(dto.email, id);
        }

        await this.prisma.user.update({
            data: {
                email: dto.email ? normalizeEmail(dto.email) : undefined,
                fullName: dto.fullName,
                isActive: dto.isActive,
            },
            where: { id },
        });

        if (dto.roleNames) {
            await this.replaceRoles(id, { roleNames: dto.roleNames });
        }

        return this.findOne(id);
    }

    async updatePassword(id: string, dto: UpdatePasswordDto) {
        await this.findOne(id);
        const passwordHash = await bcrypt.hash(dto.password, 12);

        await this.prisma.user.update({
            data: { passwordHash },
            where: { id },
        });

        return this.findOne(id);
    }

    async updateRoles(id: string, dto: UpdateUserRolesDto) {
        await this.findOne(id);
        await this.replaceRoles(id, dto);
        return this.findOne(id);
    }

    async findPermissions(id: string) {
        const user = await this.findOne(id);
        return {
            directAllowPermissions: user.directAllowPermissions,
            directDenyPermissions: user.directDenyPermissions,
            permissions: user.permissions,
            rolePermissions: user.rolePermissions,
        };
    }

    async updatePermissions(id: string, dto: UpdateUserPermissionsDto) {
        await this.findOne(id);
        const allowPermissionKeys = dto.allowPermissionKeys ?? [];
        const denyPermissionKeys = dto.denyPermissionKeys ?? [];
        const duplicate = allowPermissionKeys.find((key) =>
            denyPermissionKeys.includes(key),
        );

        if (duplicate) {
            throw new ConflictException(
                `Permission "${duplicate}" cannot be both allowed and denied.`,
            );
        }

        const permissions = await this.prisma.permission.findMany({
            where: {
                key: { in: [...allowPermissionKeys, ...denyPermissionKeys] },
            },
        });
        const foundKeys = new Set(
            permissions.map((permission) => permission.key),
        );
        const missing = [...allowPermissionKeys, ...denyPermissionKeys].filter(
            (key) => !foundKeys.has(key),
        );

        if (missing.length > 0) {
            throw new NotFoundException(
                `Unknown permission keys: ${missing.join(', ')}`,
            );
        }

        await this.prisma.$transaction([
            this.prisma.userPermission.deleteMany({ where: { userId: id } }),
            ...permissions.map((permission) =>
                this.prisma.userPermission.create({
                    data: {
                        effect: allowPermissionKeys.includes(permission.key)
                            ? 'ALLOW'
                            : 'DENY',
                        permissionId: permission.id,
                        userId: id,
                    },
                }),
            ),
        ]);

        return this.findOne(id);
    }

    async updateActive(id: string, dto: UpdateUserActiveDto) {
        await this.findOne(id);
        await this.prisma.user.update({
            data: { isActive: dto.isActive },
            where: { id },
        });

        return this.findOne(id);
    }

    async findRoles() {
        return this.prisma.role.findMany({
            include: {
                rolePermissions: {
                    include: {
                        permission: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    private async replaceRoles(userId: string, dto: UpdateUserRolesDto) {
        const roleNames = dto.roleNames ?? [];
        const roleIds = dto.roleIds ?? [];
        if (roleNames.length === 0 && roleIds.length === 0) {
            throw new NotFoundException('At least one role is required.');
        }

        const roleFilters: Prisma.RoleWhereInput[] = [];
        if (roleNames.length) {
            roleFilters.push({ name: { in: roleNames } });
        }
        if (roleIds.length) {
            roleFilters.push({ id: { in: roleIds } });
        }
        const roles = await this.prisma.role.findMany({
            where: { OR: roleFilters },
        });

        if (roles.length !== new Set([...roleNames, ...roleIds]).size) {
            throw new NotFoundException('One or more roles were not found.');
        }

        await this.prisma.$transaction([
            this.prisma.userRole.deleteMany({ where: { userId } }),
            ...roles.map((role) =>
                this.prisma.userRole.create({
                    data: {
                        roleId: role.id,
                        userId,
                    },
                }),
            ),
        ]);
    }

    private async assertEmailAvailable(email: string, currentUserId?: string) {
        const existing = await this.prisma.user.findUnique({
            where: { email: normalizeEmail(email) },
        });

        if (existing && existing.id !== currentUserId) {
            throw new ConflictException('Username is already in use.');
        }
    }
}

const userInclude = {
    userRoles: {
        include: {
            role: {
                include: {
                    rolePermissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            },
        },
    },
    userPermissions: {
        include: {
            permission: true,
        },
    },
} as const;

type UserWithRoles = Prisma.UserGetPayload<{ include: typeof userInclude }>;

function toUserResponse(user: UserWithRoles) {
    const roles = user.userRoles.map((userRole) => ({
        description: userRole.role.description,
        id: userRole.role.id,
        isActive: userRole.role.isActive,
        name: userRole.role.name,
    }));
    const rolePermissions = uniqueSorted(
        user.userRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map(
                (rolePermission) => rolePermission.permission.key,
            ),
        ),
    );
    const directAllowPermissions = uniqueSorted(
        user.userPermissions
            .filter((userPermission) => userPermission.effect === 'ALLOW')
            .map((userPermission) => userPermission.permission.key),
    );
    const directDenyPermissions = uniqueSorted(
        user.userPermissions
            .filter((userPermission) => userPermission.effect === 'DENY')
            .map((userPermission) => userPermission.permission.key),
    );
    const denied = new Set(directDenyPermissions);
    const permissions = uniqueSorted([
        ...rolePermissions,
        ...directAllowPermissions,
    ]).filter((permission) => !denied.has(permission));

    return {
        createdAt: user.createdAt,
        directAllowPermissions,
        directDenyPermissions,
        email: user.email,
        fullName: user.fullName,
        id: user.id,
        isActive: user.isActive,
        permissions,
        rolePermissions,
        roles,
        updatedAt: user.updatedAt,
    };
}

function uniqueSorted(values: string[]) {
    return Array.from(new Set(values)).sort();
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}
