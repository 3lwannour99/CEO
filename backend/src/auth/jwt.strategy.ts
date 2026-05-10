import { Injectable } from '@nestjs/common';
import { JwtPayload, AuthenticatedUser } from './auth.types';

@Injectable()
export class JwtStrategy {
    validate(payload: JwtPayload): AuthenticatedUser {
        return {
            fullName: payload.fullName,
            id: payload.sub,
            permissions: payload.permissions ?? [],
            roles: payload.roles ?? [],
            username: payload.username,
        };
    }
}
