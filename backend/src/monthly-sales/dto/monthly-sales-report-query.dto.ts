import { IsOptional, IsString, Matches } from 'class-validator';

export class MonthlySalesReportQueryDto {
    @IsOptional()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    dateFrom?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    dateTo?: string;

    @IsOptional()
    @IsString()
    salesLocation?: string;

    @IsOptional()
    @IsString()
    salesman?: string;

    @IsOptional()
    @IsString()
    brands?: string;

    @IsOptional()
    @IsString()
    countries?: string;

    @IsOptional()
    @IsString()
    sourceIds?: string;

    @IsOptional()
    @IsString()
    branches?: string;

    @IsOptional()
    @IsString()
    warehouses?: string;

    @IsOptional()
    @IsString()
    models?: string;

    @IsOptional()
    @IsString()
    types?: string;

    @IsOptional()
    @IsString()
    customerGroups?: string;

    @IsOptional()
    @IsString()
    statuses?: string;

    @IsOptional()
    @IsString()
    search?: string;
}
