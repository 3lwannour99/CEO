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

    @IsOptional()
    @IsString()
    groupId?: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    allowedBrands!: string[];
}

export class MonthlySalesGroupDto {
    @IsString()
    locationId!: string;

    @IsString()
    name!: string;
}

export class ReorderMonthlySalesLocationsDto {
    @IsString()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    targetMonth!: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    locationIds!: string[];
}

export class ReorderMonthlySalesAssignmentsDto {
    @IsString()
    locationId!: string;

    @IsOptional()
    @IsString()
    groupId?: string;

    @IsArray()
    @IsString({ each: true })
    assignmentIds!: string[];
}
