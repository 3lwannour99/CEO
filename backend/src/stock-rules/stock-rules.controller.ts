import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { StockRuleDto } from './dto/stock-rule.dto';
import { StockRulesService } from './stock-rules.service';

@Controller('stock-rules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockRulesController {
    constructor(private readonly stockRulesService: StockRulesService) {}

    @Get()
    @RequirePermissions('stockRules.view')
    findAll() {
        return this.stockRulesService.findAll();
    }

    @Post()
    @RequirePermissions('stockRules.manage')
    create(@Body() dto: StockRuleDto) {
        return this.stockRulesService.create(dto);
    }

    @Put(':id')
    @RequirePermissions('stockRules.manage')
    update(@Param('id') id: string, @Body() dto: StockRuleDto) {
        return this.stockRulesService.update(id, dto);
    }

    @Delete(':id')
    @RequirePermissions('stockRules.manage')
    remove(@Param('id') id: string) {
        return this.stockRulesService.remove(id);
    }
}
