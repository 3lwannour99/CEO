import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { MonthlySalesReportQueryDto } from './dto/monthly-sales-report-query.dto';
import {
    MonthlySalesAssignmentDto,
    MonthlySalesLocationDto,
    ReorderMonthlySalesLocationsDto,
} from './dto/monthly-sales-target.dto';
import { MonthlySalesService } from './monthly-sales.service';

class SetLocationActiveDto {
    @IsBoolean()
    isActive!: boolean;
}

@Controller()
export class MonthlySalesController {
    constructor(private readonly monthlySalesService: MonthlySalesService) {}

    @Get('public/monthly-sales-report')
    getPublicReport(@Query() query: MonthlySalesReportQueryDto) {
        return this.monthlySalesService.getPublicReport(query);
    }

    @Get('monthly-sales-targets')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('monthlySalesTargets.view')
    getManagementBoard(
        @Query('targetMonth') targetMonth: string,
        @Query('countries') countries?: string,
    ) {
        return this.monthlySalesService.getManagementBoard(
            targetMonth,
            splitQueryFilter(countries),
        );
    }

    @Post('monthly-sales-targets/locations')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('monthlySalesTargets.manage')
    createLocation(@Body() dto: MonthlySalesLocationDto) {
        return this.monthlySalesService.createLocation(dto);
    }

    @Put('monthly-sales-targets/locations/reorder')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('monthlySalesTargets.manage')
    reorderLocations(@Body() dto: ReorderMonthlySalesLocationsDto) {
        return this.monthlySalesService.reorderLocations(dto);
    }

    @Put('monthly-sales-targets/locations/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('monthlySalesTargets.manage')
    updateLocation(
        @Param('id') id: string,
        @Body() dto: MonthlySalesLocationDto,
    ) {
        return this.monthlySalesService.updateLocation(id, dto);
    }

    @Patch('monthly-sales-targets/locations/:id/active')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('monthlySalesTargets.manage')
    setLocationActive(
        @Param('id') id: string,
        @Body() dto: SetLocationActiveDto,
    ) {
        return this.monthlySalesService.setLocationActive(id, dto.isActive);
    }

    @Delete('monthly-sales-targets/locations/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('monthlySalesTargets.manage')
    deleteLocation(@Param('id') id: string) {
        return this.monthlySalesService.deleteLocation(id);
    }

    @Put('monthly-sales-targets/assignments')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('monthlySalesTargets.manage')
    assignSalesman(@Body() dto: MonthlySalesAssignmentDto) {
        return this.monthlySalesService.assignSalesman(dto);
    }

    @Delete('monthly-sales-targets/assignments/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('monthlySalesTargets.manage')
    unassignSalesman(@Param('id') id: string) {
        return this.monthlySalesService.unassignSalesman(id);
    }
}

function splitQueryFilter(value?: string) {
    return String(value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
