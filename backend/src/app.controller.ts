import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RequirePermissions } from './auth/permissions.decorator';
import { PermissionsGuard } from './auth/permissions.guard';
import { AppService } from './app.service';
import { CounterScreenService } from './integrations/counterscreen/counterscreen.service';

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly counterScreenService: CounterScreenService,
    ) {}

    @Get('health')
    getHealth() {
        return this.appService.getHealth();
    }

    @Get('sources')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('inventory.page.view')
    getSources() {
        return this.counterScreenService.getSources();
    }
}
