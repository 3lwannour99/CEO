import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlertsModule } from './alerts/alerts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CounterScreenModule } from './integrations/counterscreen/counterscreen.module';
import { InventorySyncModule } from './inventory-sync/inventory-sync.module';
import { InventoryModule } from './inventory/inventory.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { LogisticsModule } from './logistics/logistics.module';
import { ReplenishmentModule } from './replenishment/replenishment.module';
import { ReportsModule } from './reports/reports.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        PrismaModule,
        CounterScreenModule,
        InventorySyncModule,
        InventoryModule,
        DashboardModule,
        AlertsModule,
        ReplenishmentModule,
        LogisticsModule,
        ReportsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('/*path');
    }
}
