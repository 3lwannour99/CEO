import {
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class StockRuleDto {
    @IsOptional()
    @IsString()
    sourceId?: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    exteriorColor?: string;

    @IsOptional()
    @IsString()
    warehouse?: string;

    @IsInt()
    @Min(0)
    minStock!: number;

    @IsInt()
    @Min(0)
    maxStock!: number;

    @IsInt()
    @Min(0)
    reorderPoint!: number;

    @IsNumber()
    @Min(0)
    targetCoverageMonths = 3;

    @IsInt()
    @Min(0)
    leadTimeDays = 30;

    @IsOptional()
    @IsString()
    supplierName?: string;

    @IsOptional()
    @IsString()
    factoryName?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
