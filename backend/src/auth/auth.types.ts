export interface AuthenticatedUser {
    id: string;
    email: string;
    fullName: string;
    isActive?: boolean;
    roles: string[];
    rolePermissions?: string[];
    directAllowPermissions?: string[];
    directDenyPermissions?: string[];
    permissions: string[];
}

export interface JwtPayload {
    sub: string;
    email: string;
    fullName: string;
    roles: string[];
    permissions: string[];
}

export interface RequestWithUser {
    headers: Record<string, string | string[] | undefined>;
    user?: AuthenticatedUser;
}
