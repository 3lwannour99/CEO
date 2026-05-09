import { Controller, Get, Post } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';

@Controller('snapshots')
export class SnapshotsController {
    constructor(private readonly snapshotsService: SnapshotsService) {}

    @Post('run')
    runSnapshot() {
        return this.snapshotsService.runSnapshot();
    }

    @Get()
    findAll() {
        return this.snapshotsService.findAll();
    }

    @Get('monthly-comparison')
    getMonthlyComparison() {
        return this.snapshotsService.getMonthlyComparison();
    }
}
