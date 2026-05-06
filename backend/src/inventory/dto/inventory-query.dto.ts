import { IsOptional, IsString } from 'class-validator';

export class InventoryQueryDto {
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
    color?: string;

    @IsOptional()
    @IsString()
    branch?: string;

    @IsOptional()
    @IsString()
    warehouse?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    movementCategory?: string;

    @IsOptional()
    @IsString()
    ready?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    refresh?: string;
}
