import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma-client/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleActiveDto } from './dto/update-role-active.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        const roles = await this.prisma.role.findMany({
            include: roleInclude,
            orderBy: { name: 'asc' },
        });

        return roles.map(toRoleResponse);
    }

    async findOne(id: string) {
        const role = await this.prisma.role.findUnique({
            include: roleInclude,
            where: { id },
        });

        if (!role) {
            throw new NotFoundException('Role not found.');
        }

        return toRoleResponse(role);
    }

    async create(dto: CreateRoleDto) {
        await this.assertRoleNameAvailable(dto.name);
        const role = await this.prisma.role.create({
            data: {
                description: dto.description,
                isActive: dto.isActive ?? true,
                name: normalizeRoleName(dto.name),
            },
        });

        if (dto.permissionKeys) {
            await this.replacePermissions(role.id, dto.permissionKeys);
        }

        return this.findOne(role.id);
    }

    async update(id: string, dto: UpdateRoleDto) {
        const current = await this.findRoleOrThrow(id);
        if (dto.name) {
            await this.assertRoleNameAvailable(dto.name, id);
        }
        this.assertSuperAdminSafe(current.name, dto.isActive);

        await this.prisma.role.update({
            data: {
                description: dto.description,
                isActive: dto.isActive,
                name: dto.name ? normalizeRoleName(dto.name) : undefined,
            },
            where: { id },
        });

        return this.findOne(id);
    }

    async updatePermissions(id: string, dto: UpdateRolePermissionsDto) {
        const role = await this.findRoleOrThrow(id);
        if (role.name === 'SUPER_ADMIN' && dto.permissionKeys.length === 0) {
            throw new ConflictException(
                'SUPER_ADMIN role must keep at least one permission.',
            );
        }

        await this.replacePermissions(id, dto.permissionKeys);
        return this.findOne(id);
    }

    async updateActive(id: string, dto: UpdateRoleActiveDto) {
        const role = await this.findRoleOrThrow(id);
        this.assertSuperAdminSafe(role.name, dto.isActive);
        await this.prisma.role.update({
            data: { isActive: dto.isActive },
            where: { id },
        });
        return this.findOne(id);
    }

    async remove(id: string) {
        const role = await this.findRoleOrThrow(id);
        if (role.name === 'SUPER_ADMIN') {
            throw new ConflictException('SUPER_ADMIN role cannot be deleted.');
        }

        await this.prisma.role.update({
            data: { isActive: false },
            where: { id },
        });

        return this.findOne(id);
    }

    private async replacePermissions(roleId: string, permissionKeys: string[]) {
        const permissions = await this.prisma.permission.findMany({
            where: { key: { in: permissionKeys } },
        });
        const foundKeys = new Set(
            permissions.map((permission) => permission.key),
        );
        const missing = permissionKeys.filter((key) => !foundKeys.has(key));

        if (missing.length > 0) {
            throw new NotFoundException(
                `Unknown permission keys: ${missing.join(', ')}`,
            );
        }

        await this.prisma.$transaction([
            this.prisma.rolePermission.deleteMany({ where: { roleId } }),
            ...permissions.map((permission) =>
                this.prisma.rolePermission.create({
                    data: {
                        permissionId: permission.id,
                        roleId,
                    },
                }),
            ),
        ]);
    }

    private async findRoleOrThrow(id: string) {
        const role = await this.prisma.role.findUnique({ where: { id } });
        if (!role) {
            throw new NotFoundException('Role not found.');
        }

        return role;
    }

    private async assertRoleNameAvailable(
        name: string,
        currentRoleId?: string,
    ) {
        const existing = await this.prisma.role.findUnique({
            where: { name: normalizeRoleName(name) },
        });

        if (existing && existing.id !== currentRoleId) {
            throw new ConflictException('Role name is already in use.');
        }
    }

    private assertSuperAdminSafe(roleName: string, isActive?: boolean) {
        if (roleName === 'SUPER_ADMIN' && isActive === false) {
            throw new ConflictException('SUPER_ADMIN role cannot be disabled.');
        }
    }
}

const roleInclude = {
    _count: {
        select: {
            userRoles: true,
        },
    },
    rolePermissions: {
        include: {
            permission: true,
        },
        orderBy: {
            permission: {
                key: 'asc',
            },
        },
    },
} as const;

type RoleWithPermissions = Prisma.RoleGetPayload<{
    include: typeof roleInclude;
}>;

function toRoleResponse(role: RoleWithPermissions) {
    return {
        createdAt: role.createdAt,
        description: role.description,
        id: role.id,
        isActive: role.isActive,
        name: role.name,
        permissionKeys: role.rolePermissions.map(
            (rolePermission) => rolePermission.permission.key,
        ),
        permissions: role.rolePermissions.map(
            (rolePermission) => rolePermission.permission,
        ),
        updatedAt: role.updatedAt,
        userCount: role._count.userRoles,
    };
}

function normalizeRoleName(name: string) {
    return name.trim().replace(/\s+/g, '_').toUpperCase();
}
