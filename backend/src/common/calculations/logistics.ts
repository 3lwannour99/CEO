import { InventoryItem } from '../../integrations/counterscreen/counterscreen.types';

export type LogisticsDerivedStatus =
    | 'In Transit'
    | 'At Port'
    | 'Customs'
    | 'Warehouse'
    | 'Sold'
    | 'Unknown';

export function deriveLogisticsStatus(
    item: InventoryItem,
): LogisticsDerivedStatus {
    if (item.normalizedStatus === 'sold') {
        return 'Sold';
    }

    const haystack =
        `${item.notes} ${item.warehouse} ${item.rawStatus} ${item.displayStatus} ${item.soRemarks} ${item.additionalRemark}`.toLowerCase();

    if (haystack.includes('custom')) {
        return 'Customs';
    }

    if (haystack.includes('port') || haystack.includes('ميناء')) {
        return 'At Port';
    }

    if (item.grpoDate) {
        return 'Warehouse';
    }

    if (item.estimatedArrival && !item.grpoDate) {
        return 'In Transit';
    }

    return 'Unknown';
}

export function daysBetween(from?: string, to?: string): number | null {
    if (!from || !to) {
        return null;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        return null;
    }

    return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

export function getOrderDate(item: InventoryItem): string {
    return (
        item.apInvoiceDate ||
        item.createDate ||
        item.contractDate ||
        item.reserveDate ||
        ''
    );
}
