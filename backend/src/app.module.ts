import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CounterScreenModule } from './integrations/counterscreen/counterscreen.module';
import { InventoryEventsModule } from './inventory-events/inventory-events.module';
import { InventorySyncModule } from './inventory-sync/inventory-sync.module';
import { InventoryModule } from './inventory/inventory.module';
import { PrismaModule } from './prisma/prisma.module';
import { PermissionsModule } from './permissions/permissions.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { LogisticsModule } from './logistics/logistics.module';
import { ReplenishmentModule } from './replenishment/replenishment.module';
import { ReportsModule } from './reports/reports.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SnapshotsModule } from './snapshots/snapshots.module';
import { StockRulesModule } from './stock-rules/stock-rules.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { MonthlySalesModule } from './monthly-sales/monthly-sales.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        PrismaModule,
        AuthModule,
        PermissionsModule,
        RolesModule,
        UsersModule,
        CounterScreenModule,
        InventoryEventsModule,
        InventorySyncModule,
        InventoryModule,
        DashboardModule,
        AlertsModule,
        ReplenishmentModule,
        LogisticsModule,
        ReportsModule,
        StockRulesModule,
        SnapshotsModule,
        SchedulerModule,
        MonthlySalesModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('/*path');
    }
}
