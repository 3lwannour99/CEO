import { ArrayUnique, IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateUserPermissionsDto {
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    allowPermissionKeys?: string[];

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    denyPermissionKeys?: string[];
}
