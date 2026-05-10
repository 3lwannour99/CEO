export interface AuthenticatedUser {
    id: string;
    username: string;
    email?: string | null;
    fullName: string;
    roles: string[];
    permissions: string[];
}

export interface JwtPayload {
    sub: string;
    username: string;
    fullName: string;
    roles: string[];
    permissions: string[];
}

export interface RequestWithUser {
    headers: Record<string, string | string[] | undefined>;
    user?: AuthenticatedUser;
}
