import { InventoryItem } from '../../integrations/counterscreen/counterscreen.types';

export interface StockRuleShape {
    id?: string;
    sourceId?: string | null;
    brand?: string | null;
    model?: string | null;
    type?: string | null;
    exteriorColor?: string | null;
    warehouse?: string | null;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
    targetCoverageMonths: number;
    leadTimeDays: number;
    supplierName?: string | null;
    factoryName?: string | null;
    isActive?: boolean;
}

export const DEFAULT_STOCK_RULE: StockRuleShape = {
    minStock: 1,
    maxStock: 10,
    reorderPoint: 2,
    targetCoverageMonths: 3,
    leadTimeDays: 30,
    isActive: true,
};

export function resolveStockRule(
    item: Pick<
        InventoryItem,
        'sourceId' | 'brand' | 'model' | 'type' | 'exteriorColor' | 'warehouse'
    >,
    rules: StockRuleShape[],
): StockRuleShape {
    const activeRules = rules.filter((rule) => rule.isActive !== false);
    const candidates = [
        (rule: StockRuleShape) =>
            matches(rule.sourceId, item.sourceId) &&
            matches(rule.brand, item.brand) &&
            matches(rule.model, item.model) &&
            matches(rule.type, item.type) &&
            matches(rule.exteriorColor, item.exteriorColor) &&
            matches(rule.warehouse, item.warehouse),
        (rule: StockRuleShape) =>
            matches(rule.sourceId, item.sourceId) &&
            matches(rule.model, item.model) &&
            matches(rule.exteriorColor, item.exteriorColor) &&
            !rule.warehouse,
        (rule: StockRuleShape) =>
            matches(rule.model, item.model) &&
            matches(rule.exteriorColor, item.exteriorColor) &&
            !rule.sourceId &&
            !rule.warehouse,
        (rule: StockRuleShape) =>
            matches(rule.model, item.model) &&
            !rule.sourceId &&
            !rule.exteriorColor &&
            !rule.warehouse,
        (rule: StockRuleShape) =>
            !rule.sourceId &&
            !rule.brand &&
            !rule.model &&
            !rule.type &&
            !rule.exteriorColor &&
            !rule.warehouse,
    ];

    for (const candidate of candidates) {
        const found = activeRules.find(candidate);
        if (found) {
            return found;
        }
    }

    return DEFAULT_STOCK_RULE;
}

function matches(ruleValue: string | null | undefined, itemValue: string) {
    return (
        !ruleValue ||
        ruleValue.toLowerCase() === (itemValue || '').toLowerCase()
    );
}
