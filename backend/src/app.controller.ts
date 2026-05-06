import { Controller, Get } from '@nestjs/common';
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
    getSources() {
        return this.counterScreenService.getSources();
    }
}
