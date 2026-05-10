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

        await this.replaceRoles(user.id, dto.roleNames ?? ['VIEWER']);
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
            await this.replaceRoles(id, dto.roleNames);
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
        await this.replaceRoles(id, dto.roleNames);
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

    private async replaceRoles(userId: string, roleNames: string[]) {
        const roles = await this.prisma.role.findMany({
            where: {
                name: {
                    in: roleNames,
                },
            },
        });

        if (roles.length !== roleNames.length) {
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
} as const;

type UserWithRoles = Prisma.UserGetPayload<{ include: typeof userInclude }>;

function toUserResponse(user: UserWithRoles) {
    const roles = user.userRoles.map((userRole) => ({
        description: userRole.role.description,
        id: userRole.role.id,
        name: userRole.role.name,
    }));
    const permissions = Array.from(
        new Set(
            user.userRoles.flatMap((userRole) =>
                userRole.role.rolePermissions.map(
                    (rolePermission) => rolePermission.permission.key,
                ),
            ),
        ),
    ).sort();

    return {
        createdAt: user.createdAt,
        email: user.email,
        fullName: user.fullName,
        id: user.id,
        isActive: user.isActive,
        permissions,
        roles,
        updatedAt: user.updatedAt,
    };
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}
