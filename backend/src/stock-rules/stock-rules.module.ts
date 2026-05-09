import { Module } from '@nestjs/common';
import { StockRulesController } from './stock-rules.controller';
import { StockRulesService } from './stock-rules.service';

@Module({
    controllers: [StockRulesController],
    exports: [StockRulesService],
    providers: [StockRulesService],
})
export class StockRulesModule {}
