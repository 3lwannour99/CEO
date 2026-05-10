import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { InventoryQueryDto } from '../inventory/dto/inventory-query.dto';
import { ReplenishmentService } from './replenishment.service';

@Controller('replenishment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReplenishmentController {
    constructor(private readonly replenishmentService: ReplenishmentService) {}

    @Get()
    @RequirePermissions('replenishment.view')
    findAll(@Query() query: InventoryQueryDto) {
        return this.replenishmentService.findAll(query);
    }
}
