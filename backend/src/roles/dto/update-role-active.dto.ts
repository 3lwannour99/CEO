import { IsBoolean } from 'class-validator';

export class UpdateRoleActiveDto {
    @IsBoolean()
    isActive!: boolean;
}
