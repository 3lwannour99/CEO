import {
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsEmail,
    IsOptional,
    IsString,
} from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    roleNames?: string[];
}
