import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlertsModule } from './alerts/alerts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CounterScreenModule } from './integrations/counterscreen/counterscreen.module';
import { InventoryModule } from './inventory/inventory.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { LogisticsModule } from './logistics/logistics.module';
import { ReplenishmentModule } from './replenishment/replenishment.module';
import { ReportsModule } from './reports/reports.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SnapshotsModule } from './snapshots/snapshots.module';
import { StockRulesModule } from './stock-rules/stock-rules.module';

@Module({
    imports: [
        PrismaModule,
        CounterScreenModule,
        InventoryModule,
        DashboardModule,
        AlertsModule,
        ReplenishmentModule,
        LogisticsModule,
        ReportsModule,
        StockRulesModule,
        SnapshotsModule,
        SchedulerModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('/*path');
    }
}
