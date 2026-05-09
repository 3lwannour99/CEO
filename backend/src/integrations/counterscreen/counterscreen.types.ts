export interface CounterScreenSource {
    id: string;
    name: string;
    country: string;
    baseUrl: string;
}

export type RawCounterScreenItem = Record<string, unknown>;

export type MovementCategory = 'fast' | 'medium' | 'slow' | 'unknown';

export type NormalizedVehicleStatus =
    | 'sold'
    | 'inStock'
    | 'notAvailable'
    | 'reserve'
    | 'reservationForCompanies'
    | 'cession'
    | 'contract'
    | 'error'
    | 'unknown';

export type DisplayVehicleStatus =
    | 'Sold'
    | 'In-Stock'
    | 'Not-Available'
    | 'Reserve'
    | 'Reservation for Companies'
    | 'Cession'
    | 'Contract'
    | 'Error'
    | 'Unknown';

export interface InventoryItem {
    absEntry: number | null;
    chassis: string;
    itemCode: string;
    model: string;
    itemGroupCode: number | null;
    type: string;
    modelYear: string;
    exteriorColor: string;
    interiorColor: string;
    wheel: string;
    notes: string;
    quantity: number;
    branch: string;
    ready: boolean;
    brand: string;
    engineNo: string;
    price1: number | null;
    listNum1: number | null;
    listName1: string;
    price2: number | null;
    listNum2: number | null;
    listName2: string;
    price3: number | null;
    listNum3: number | null;
    listName3: string;
    price4: number | null;
    listNum4: number | null;
    listName4: string;
    poNo: string;
    estimatedArrival: string;
    grpoDate: string;
    salesMan: string;
    arInvoiceDate: string;
    soldPrice: number;
    vat: number;
    customerName: string;
    customerGroup: string;
    plateNumber: string;
    apInvoiceDate: string;
    apInvoiceNo: string;
    chassisStatus: string;
    displayStatus: DisplayVehicleStatus;
    normalizedStatus: NormalizedVehicleStatus;
    arInvoiceNo: string;
    cardCode: string;
    createDate: string;
    warehouse: string;
    bank: string;
    bankCode: string;
    contractDate: string;
    reserveDate: string;
    customerNumber: string;
    recipientName: string;
    recipientNumber: string;
    uTanazol: string;
    uMobNum: string;
    soRemarks: string;
    additionalRemark: string;
    sourceId: string;
    sourceName: string;
    sourceCountry: string;
    sourceBaseUrl: string;
    stockAgeDays: number | null;
    movementCategory: MovementCategory;
    isSold: boolean;
    isReserved: boolean;
    isInStock: boolean;
    isReadyForSale: boolean;
    rawStatus: string;
}

export interface SourceError {
    sourceId: string;
    sourceName: string;
    message: string;
}

export interface SourceFetchResult {
    source: CounterScreenSource;
    data: RawCounterScreenItem[];
    error?: SourceError;
}

export interface InventoryMeta {
    total: number;
    generatedAt: string;
    fromCache: boolean;
    sourceCount: number;
    successfulSources: number;
    failedSources: number;
    errors: SourceError[];
}

export interface InventoryResponse {
    data: InventoryItem[];
    meta: InventoryMeta;
}

export interface RawInventoryResponse {
    data: Array<{
        source: CounterScreenSource;
        records: RawCounterScreenItem[];
        error?: SourceError;
    }>;
    meta: Omit<InventoryMeta, 'total'> & { totalRawRecords: number };
}

export interface InventorySummary {
    totalUnits: number;
    currentStockUnits: number;
    soldUnits: number;
    reservedUnits: number;
    fastMovingUnits: number;
    mediumMovingUnits: number;
    slowMovingUnits: number;
    unknownAgeUnits: number;
    inTransitUnits: number;
    readyForSaleUnits: number;
    stockCoverageMonths: number | null;
    sources: Array<{
        sourceId: string;
        sourceName: string;
        country: string;
        totalUnits: number;
        currentStockUnits: number;
    }>;
}

export interface DashboardSummary {
    metrics: Record<string, number | string | null>;
    inventoryStatusSummary: Record<string, number | null>;
    topSellingModels: unknown[];
    slowStockList: InventoryItem[];
    recentAlerts: unknown[];
    stockByLocation: unknown[];
    salesPerformanceSnapshot: unknown[];
    logisticsStatusSnapshot: unknown[];
    meta: InventoryMeta;
}
