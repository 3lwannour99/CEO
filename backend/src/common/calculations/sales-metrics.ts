import { InventoryItem } from '../../integrations/counterscreen/counterscreen.types';
import { round, sumBy } from './grouping';

export function sumQuantity(items: InventoryItem[]): number {
    return sumBy(items, (item) => item.quantity || 1);
}

export function sumSoldPrice(items: InventoryItem[]): number {
    return sumBy(items, (item) => item.soldPrice || 0);
}

export function soldInLastDays(item: InventoryItem, days: number): boolean {
    if (!item.isSold || !item.arInvoiceDate) {
        return false;
    }

    const date = new Date(item.arInvoiceDate);
    return (
        !Number.isNaN(date.getTime()) &&
        Date.now() - date.getTime() <= days * 86_400_000
    );
}

export function getSalesKpis(items: InventoryItem[]) {
    const soldUnits = sumQuantity(items.filter((item) => item.isSold));
    const currentStockUnits = sumQuantity(
        items.filter((item) => item.isInStock),
    );
    const denominator = soldUnits + currentStockUnits;
    // Until enough snapshots exist, current inventory is used as average inventory fallback.
    const averageInventory = currentStockUnits || denominator || 1;

    return {
        soldUnits,
        currentStockUnits,
        sellThroughRate:
            denominator > 0 ? round((soldUnits / denominator) * 100) : 0,
        inventoryTurnover: round(soldUnits / averageInventory),
    };
}
