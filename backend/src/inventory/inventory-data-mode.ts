export type InventoryDataMode = 'database' | 'live';

export function getInventoryDataMode(): InventoryDataMode {
    const rawMode = (process.env.INVENTORY_DATA_MODE ?? 'database')
        .trim()
        .toLowerCase();

    if (rawMode === 'database' || rawMode === 'live') {
        return rawMode;
    }

    throw new Error(
        `Invalid INVENTORY_DATA_MODE "${process.env.INVENTORY_DATA_MODE}". Use "database" or "live".`,
    );
}

export function isInventorySyncEnabled() {
    return process.env.INVENTORY_SYNC_ENABLED !== 'false';
}
