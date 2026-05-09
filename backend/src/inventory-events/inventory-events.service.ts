import { Injectable } from '@nestjs/common';
import { InventoryEventsGateway } from './inventory-events.gateway';

export type InventoryUpdatedPayload = {
    syncRunId: string;
    status: 'success' | 'partial_success' | 'failed';
    lastSyncedAt: string;
    totalRows: number;
    totalRawRecords: number;
    totalNormalizedRecords: number;
    successfulSources: number;
    failedSources: number;
    sourceResults: Array<{
        sourceId: string;
        sourceName: string;
        status: 'success' | 'failed';
        recordsCount: number;
        errorMessage?: string;
    }>;
};

@Injectable()
export class InventoryEventsService {
    constructor(private readonly gateway: InventoryEventsGateway) {}

    emitInventoryUpdated(payload: InventoryUpdatedPayload) {
        this.gateway.emitInventoryUpdated(payload);
    }
}
