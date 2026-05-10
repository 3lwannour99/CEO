import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { RequestWithUser } from './auth.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const required =
            this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? [];

        if (required.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const user = request.user;

        if (!user) {
            throw new UnauthorizedException('Authenticated user is required.');
        }

        if (user.roles.includes('SUPER_ADMIN')) {
            return true;
        }

        const granted = new Set(user.permissions);
        const allowed = required.every((permission) => granted.has(permission));
        if (!allowed) {
            throw new ForbiddenException('Missing required permission.');
        }

        return true;
    }
}
