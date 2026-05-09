import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { StockRuleDto } from './dto/stock-rule.dto';
import { StockRulesService } from './stock-rules.service';

@Controller('stock-rules')
export class StockRulesController {
    constructor(private readonly stockRulesService: StockRulesService) {}

    @Get()
    findAll() {
        return this.stockRulesService.findAll();
    }

    @Post()
    create(@Body() dto: StockRuleDto) {
        return this.stockRulesService.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: StockRuleDto) {
        return this.stockRulesService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.stockRulesService.remove(id);
    }
}
