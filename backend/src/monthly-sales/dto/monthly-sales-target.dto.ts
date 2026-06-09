import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    Matches,
    Min,
} from 'class-validator';

export class MonthlySalesLocationDto {
    @IsString()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    targetMonth!: string;

    @IsString()
    salesLocation!: string;

    @IsInt()
    @Min(0)
    target!: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class MonthlySalesAssignmentDto {
    @IsString()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    targetMonth!: string;

    @IsString()
    salesmanName!: string;

    @IsOptional()
    @IsString()
    salesmanCode?: string;

    @IsString()
    locationId!: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    allowedBrands!: string[];
}
