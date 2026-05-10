import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'requiredPermissions';

export function RequirePermissions(...permissions: string[]) {
    return SetMetadata(PERMISSIONS_KEY, permissions);
}
