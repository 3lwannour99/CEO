import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import type { Prisma } from '../generated/prisma-client/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { getJwtExpiresIn, getJwtSecret } from './auth.config';
import { AuthenticatedUser, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) {}

    async login(username: string, password: string) {
        const user = await this.prisma.user.findUnique({
            include: userAuthInclude,
            where: { username: normalizeUsername(username) },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid username or password.');
        }
        if (!user.username) {
            throw new UnauthorizedException('Invalid username or password.');
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash,
        );
        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid username or password.');
        }

        const currentUser = {
            ...toAuthenticatedUser(user),
            ...(await this.getEffectivePermissions(user.id)),
        };
        const payload: JwtPayload = {
            fullName: currentUser.fullName,
            permissions: [],
            roles: [],
            sub: currentUser.id,
            username: currentUser.username,
        };

        return {
            accessToken: await this.jwtService.signAsync(payload, {
                expiresIn: getJwtExpiresIn(),
                secret: getJwtSecret(),
            }),
            user: currentUser,
        };
    }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            include: userAuthInclude,
            where: { id: userId },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException(
                'User is inactive or no longer exists.',
            );
        }
        if (!user.username) {
            throw new UnauthorizedException('User username is not configured.');
        }

        return {
            ...toAuthenticatedUser(user),
            ...(await this.getEffectivePermissions(user.id)),
        };
    }

    async getEffectivePermissions(userId: string) {
        const [user, allPermissions] = await Promise.all([
            this.prisma.user.findUnique({
                include: userAuthInclude,
                where: { id: userId },
            }),
            this.prisma.permission.findMany({ orderBy: { key: 'asc' } }),
        ]);

        if (!user) {
            throw new NotFoundException('User not found.');
        }

        const roles = user.userRoles
            .map((userRole) => userRole.role.name)
            .sort();
        const rolePermissions = uniqueSorted(
            roles.includes('SUPER_ADMIN')
                ? allPermissions.map((permission) => permission.key)
                : user.userRoles.flatMap((userRole) =>
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
            directAllowPermissions,
            directDenyPermissions,
            permissions,
            rolePermissions,
            roles,
        };
    }
}

const userAuthInclude = {
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

type UserWithAuth = Prisma.UserGetPayload<{ include: typeof userAuthInclude }>;

function toAuthenticatedUser(user: UserWithAuth): AuthenticatedUser {
    const roles = user.userRoles.map((userRole) => userRole.role.name).sort();
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
        email: user.email,
        fullName: user.fullName,
        id: user.id,
        isActive: user.isActive,
        directAllowPermissions,
        directDenyPermissions,
        permissions,
        rolePermissions,
        roles,
        username: user.username ?? '',
    };
}

function uniqueSorted(values: string[]) {
    return Array.from(new Set(values)).sort();
}

function normalizeUsername(username: string) {
    return username.trim().toLowerCase();
}
