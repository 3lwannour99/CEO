import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SnapshotsModule } from '../snapshots/snapshots.module';
import { SchedulerService } from './scheduler.service';

@Module({
    imports: [ScheduleModule.forRoot(), SnapshotsModule],
    providers: [SchedulerService],
})
export class SchedulerModule {}
