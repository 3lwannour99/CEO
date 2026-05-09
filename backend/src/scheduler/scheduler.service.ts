import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SnapshotsService } from '../snapshots/snapshots.service';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private readonly snapshotsService: SnapshotsService,
        private readonly prisma: PrismaService,
    ) {}

    @Cron(process.env.REPORT_SNAPSHOT_CRON || '0 2 * * *')
    async runDailySnapshot() {
        if (process.env.ENABLE_SCHEDULED_REPORTS !== 'true') {
            return;
        }

        const run = await this.prisma.scheduledReportRun.create({
            data: { reportType: 'dailySnapshot', status: 'running' },
        });

        try {
            const snapshot = await this.snapshotsService.runSnapshot();
            await this.prisma.scheduledReportRun.update({
                where: { id: run.id },
                data: {
                    status: 'success',
                    finishedAt: new Date(),
                    metadata: { snapshotId: snapshot.id },
                },
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown scheduler error';
            this.logger.error(message);
            await this.prisma.scheduledReportRun.update({
                where: { id: run.id },
                data: {
                    status: 'failed',
                    finishedAt: new Date(),
                    errorMessage: message,
                },
            });
        }
    }
}
