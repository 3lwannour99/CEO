import {
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsEmail,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email!: string;

    @IsString()
    fullName!: string;

    @IsString()
    @MinLength(8)
    password!: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    roleNames?: string[];
}
