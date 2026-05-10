import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { SnapshotsService } from './snapshots.service';

@Controller('snapshots')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SnapshotsController {
    constructor(private readonly snapshotsService: SnapshotsService) {}

    @Post('run')
    @RequirePermissions('actions.createSnapshot.execute')
    runSnapshot() {
        return this.snapshotsService.runSnapshot();
    }

    @Get()
    @RequirePermissions('snapshots.page.view')
    findAll() {
        return this.snapshotsService.findAll();
    }

    @Get('monthly-comparison')
    @RequirePermissions('snapshots.page.view')
    getMonthlyComparison() {
        return this.snapshotsService.getMonthlyComparison();
    }
}
