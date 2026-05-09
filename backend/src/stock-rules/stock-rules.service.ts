import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockRuleDto } from './dto/stock-rule.dto';

@Injectable()
export class StockRulesService {
    constructor(private readonly prisma: PrismaService) {}

    findAll() {
        return this.prisma.stockRule.findMany({
            orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
        });
    }

    create(dto: StockRuleDto) {
        return this.prisma.stockRule.create({ data: sanitize(dto) });
    }

    update(id: string, dto: StockRuleDto) {
        return this.prisma.stockRule.update({ where: { id }, data: sanitize(dto) });
    }

    remove(id: string) {
        return this.prisma.stockRule.delete({ where: { id } });
    }
}

function sanitize(dto: StockRuleDto) {
    return {
        sourceId: dto.sourceId || null,
        brand: dto.brand || null,
        model: dto.model || null,
        type: dto.type || null,
        exteriorColor: dto.exteriorColor || null,
        warehouse: dto.warehouse || null,
        minStock: dto.minStock,
        maxStock: dto.maxStock,
        reorderPoint: dto.reorderPoint,
        targetCoverageMonths: dto.targetCoverageMonths ?? 3,
        leadTimeDays: dto.leadTimeDays ?? 30,
        supplierName: dto.supplierName || null,
        factoryName: dto.factoryName || null,
        isActive: dto.isActive ?? true,
    };
}
