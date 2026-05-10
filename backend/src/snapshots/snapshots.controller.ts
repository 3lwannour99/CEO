import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
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
    runSnapshot(
        @Body() body: { filtered?: boolean; filters?: Record<string, string> },
    ) {
        return this.snapshotsService.runSnapshot(body);
    }

    @Get()
    @RequirePermissions('snapshots.page.view')
    findAll(@Query() query: Record<string, string>) {
        return this.snapshotsService.findAll(query);
    }

    @Get('monthly-comparison')
    @RequirePermissions('snapshots.page.view')
    getMonthlyComparison(@Query() query: Record<string, string>) {
        return this.snapshotsService.getMonthlyComparison(query);
    }

    @Get(':id')
    @RequirePermissions('snapshots.page.view')
    findOne(@Param('id') id: string, @Query() query: Record<string, string>) {
        return this.snapshotsService.findOne(id, query);
    }
}
