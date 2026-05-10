import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            include: userAuthInclude,
            where: { email: email.trim().toLowerCase() },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid username or password.');
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash,
        );
        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid username or password.');
        }

        const currentUser = toAuthenticatedUser(user);
        const payload: JwtPayload = {
            email: currentUser.email,
            fullName: currentUser.fullName,
            permissions: currentUser.permissions,
            roles: currentUser.roles,
            sub: currentUser.id,
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

        return toAuthenticatedUser(user);
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
} as const;

type UserWithAuth = Prisma.UserGetPayload<{ include: typeof userAuthInclude }>;

function toAuthenticatedUser(user: UserWithAuth): AuthenticatedUser {
    const roles = user.userRoles.map((userRole) => userRole.role.name).sort();
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
        email: user.email,
        fullName: user.fullName,
        id: user.id,
        permissions,
        roles,
    };
}
