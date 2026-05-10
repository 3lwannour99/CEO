import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getJwtSecret } from './auth.config';
import { JwtPayload, RequestWithUser } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const token = this.getBearerToken(request);

        if (!token) {
            throw new UnauthorizedException(
                'Authentication token is required.',
            );
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(
                token,
                {
                    secret: getJwtSecret(),
                },
            );

            request.user = {
                fullName: payload.fullName,
                id: payload.sub,
                permissions: [],
                roles: [],
                username: payload.username,
            };
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token.');
        }
    }

    private getBearerToken(request: RequestWithUser) {
        const header = request.headers.authorization;
        const value = Array.isArray(header) ? header[0] : header;
        const [scheme, token] = value?.split(' ') ?? [];

        return scheme?.toLowerCase() === 'bearer' ? token : undefined;
    }
}
