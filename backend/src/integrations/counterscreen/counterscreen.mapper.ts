import {
    CounterScreenSource,
    DisplayVehicleStatus,
    InventoryItem,
    MovementCategory,
    NormalizedVehicleStatus,
    RawCounterScreenItem,
} from './counterscreen.types';

function asString(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'string') {
        return value.trim();
    }

    if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return value.toString().trim();
    }

    return '';
}

function asNumber(value: unknown): number {
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    const parsed = Number(asString(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
}

function asNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(asString(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
}

function asBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value;
    }

    const normalized = asString(value).toLowerCase();
    return ['y', 'yes', 'true', '1', 'ready'].includes(normalized);
}

function parseDate(value: unknown): Date | null {
    const raw = asString(value);
    if (!raw) {
        return null;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysSince(date: Date | null): number | null {
    if (!date) {
        return null;
    }

    const diff = Date.now() - date.getTime();
    if (!Number.isFinite(diff)) {
        return null;
    }

    return Math.max(0, Math.floor(diff / 86_400_000));
}

function getMovementCategory(stockAgeDays: number | null): MovementCategory {
    if (stockAgeDays === null) {
        return 'unknown';
    }

    if (stockAgeDays > 90) {
        return 'slow';
    }

    if (stockAgeDays >= 30) {
        return 'medium';
    }

    return 'fast';
}

function normalizeStatus(value: unknown): {
    normalizedStatus: NormalizedVehicleStatus;
    displayStatus: DisplayVehicleStatus;
} {
    const key = asString(value)
        .toLowerCase()
        .replace(/[_\s]+/g, '-')
        .replace(/[^a-z-]/g, '');

    const statuses: Record<
        string,
        {
            normalizedStatus: NormalizedVehicleStatus;
            displayStatus: DisplayVehicleStatus;
        }
    > = {
        sold: { normalizedStatus: 'sold', displayStatus: 'Sold' },
        'in-stock': {
            normalizedStatus: 'inStock',
            displayStatus: 'In-Stock',
        },
        instock: { normalizedStatus: 'inStock', displayStatus: 'In-Stock' },
        available: {
            normalizedStatus: 'inStock',
            displayStatus: 'In-Stock',
        },
        'not-available': {
            normalizedStatus: 'notAvailable',
            displayStatus: 'Not-Available',
        },
        notavailable: {
            normalizedStatus: 'notAvailable',
            displayStatus: 'Not-Available',
        },
        reserve: { normalizedStatus: 'reserve', displayStatus: 'Reserve' },
        reserved: { normalizedStatus: 'reserve', displayStatus: 'Reserve' },
        'reservation-for-companies': {
            normalizedStatus: 'reservationForCompanies',
            displayStatus: 'Reservation for Companies',
        },
        reservationforcompanies: {
            normalizedStatus: 'reservationForCompanies',
            displayStatus: 'Reservation for Companies',
        },
        cession: { normalizedStatus: 'cession', displayStatus: 'Cession' },
        contract: { normalizedStatus: 'contract', displayStatus: 'Contract' },
        error: { normalizedStatus: 'error', displayStatus: 'Error' },
    };

    return (
        statuses[key] ?? {
            normalizedStatus: 'unknown',
            displayStatus: 'Unknown',
        }
    );
}

export function mapCounterScreenItem(
    raw: RawCounterScreenItem,
    source: CounterScreenSource,
): InventoryItem {
    const rawStatus = asString(raw.Chassis_Status);
    const { normalizedStatus, displayStatus } = normalizeStatus(rawStatus);
    const isSold = normalizedStatus === 'sold';
    const isReserved =
        normalizedStatus === 'reserve' ||
        normalizedStatus === 'reservationForCompanies';
    const isInStock = normalizedStatus === 'inStock';
    const stockDate =
        parseDate(raw.GRPO_Date) ??
        parseDate(raw.APInvDate) ??
        parseDate(raw.CreateDate);
    const stockAgeDays = daysSince(stockDate);
    const ready = asBoolean(raw.Ready);

    return {
        absEntry: asNullableNumber(raw.AbsEntry),
        chassis: asString(raw.Chassis),
        itemCode: asString(raw.ItemCode),
        model: asString(raw.Model),
        itemGroupCode: asNullableNumber(raw.ItmsGrpCod),
        type: asString(raw.Type),
        modelYear: asString(raw.U_Model),
        exteriorColor: asString(raw['Ext. Color']),
        interiorColor: asString(raw.Int),
        wheel: asString(raw.Wheel),
        notes: asString(raw.Notes),
        quantity: asNumber(raw.Quantity) || 1,
        branch: asString(raw.BPLName),
        ready,
        brand: asString(raw.U_Brand),
        engineNo: asString(raw.U_EngineNo),
        price1: asNullableNumber(raw.Price_1),
        listNum1: asNullableNumber(raw.ListNum_1),
        listName1: asString(raw.ListName_1),
        price2: asNullableNumber(raw.Price_2),
        listNum2: asNullableNumber(raw.ListNum_2),
        listName2: asString(raw.ListName_2),
        price3: asNullableNumber(raw.Price_3),
        listNum3: asNullableNumber(raw.ListNum_3),
        listName3: asString(raw.ListName_3),
        price4: asNullableNumber(raw.Price_4),
        listNum4: asNullableNumber(raw.ListNum_4),
        listName4: asString(raw.ListName_4),
        poNo: asString(raw.PONo),
        estimatedArrival: asString(raw.U_Estimated_TimeA),
        grpoDate: asString(raw.GRPO_Date),
        salesMan: asString(raw.SalesMan),
        arInvoiceDate: asString(raw['A/RInvDate']),
        soldPrice: asNumber(raw.SoldPrice),
        vat: asNumber(raw.Vat),
        customerName: asString(raw.CustomerName),
        customerGroup: asString(raw.CustomerGroup),
        plateNumber: asString(raw.U_Plate_Number),
        apInvoiceDate: asString(raw.APInvDate),
        apInvoiceNo: asString(raw.APInvNo),
        chassisStatus: normalizedStatus,
        displayStatus,
        normalizedStatus,
        arInvoiceNo: asString(raw.ARInvNo),
        cardCode: asString(raw.CardCode),
        createDate: asString(raw.CreateDate),
        warehouse: asString(raw.WhsName),
        bank: asString(raw.Bank),
        bankCode: asString(raw.BankCode),
        contractDate: asString(raw.ContractDate),
        reserveDate: asString(raw.ReserveDate),
        customerNumber: asString(raw['Customer Number']),
        recipientName: asString(raw.U_Tanazol ?? raw.uTanazol),
        recipientNumber: asString(raw.U_MOBNUM ?? raw.uMobNum),
        uTanazol: asString(raw.U_Tanazol ?? raw.uTanazol),
        uMobNum: asString(raw.U_MOBNUM ?? raw.uMobNum),
        soRemarks: asString(raw['SO Remarks']),
        additionalRemark: asString(raw.AdditionalRemark),
        sourceId: source.id,
        sourceName: source.name,
        sourceCountry: source.country,
        sourceBaseUrl: source.baseUrl,
        stockAgeDays,
        movementCategory: getMovementCategory(stockAgeDays),
        isSold,
        isReserved,
        isInStock,
        isReadyForSale: !isSold && ready,
        rawStatus,
    };
}
